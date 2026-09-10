"""Explicitly enabled loopback-only execution of installed local models."""
import threading
import uuid
from fastapi import HTTPException, Request
from pydantic import BaseModel, ConfigDict, Field
from core.inference.ollama_provider import installed_models
from core.inference.contracts import InferenceError
from scripts.run_local_benchmark import run_model


class RunInput(BaseModel):
    model_config = ConfigDict(extra='forbid')
    model: str = Field(min_length=1, max_length=200)


def register_execution(app, database_url, enabled=False):
    jobs = {}
    lock = threading.Lock()

    @app.get('/runtime-models')
    def runtime_models():
        try:
            return {'available': True, 'execution_enabled': enabled, 'items': installed_models()}
        except InferenceError:
            return {'available': False, 'execution_enabled': enabled, 'items': [],
                    'reason': 'Start the local Ollama service to discover installed models.'}

    @app.get('/benchmark-jobs')
    def list_jobs():
        with lock:
            return {'items': [dict(job) for job in reversed(list(jobs.values()))]}

    def execute(job_id, model):
        try:
            result = run_model(model, database_url=database_url, run_id=job_id)
            with lock:
                jobs[job_id].update(status=result['status'], result=result)
        except Exception:
            with lock:
                jobs[job_id].update(status='failed', error='Execution or persistence failed. Inspect local service logs and saved run artifacts.')

    @app.post('/internal/benchmark-jobs', status_code=202)
    def create_job(body: RunInput, request: Request):
        if not enabled:
            raise HTTPException(403, 'Local benchmark execution is disabled')
        if request.client is None or request.client.host not in {'127.0.0.1', '::1'}:
            raise HTTPException(403, 'Local execution requires a loopback connection')
        if request.headers.get('X-SecureLLM-Local') != '1' or request.headers.get('origin') not in {
            None, 'http://127.0.0.1:5173', 'http://localhost:5173', 'http://127.0.0.1:8000'}:
            raise HTTPException(403, 'Invalid local execution request')
        try:
            names = {model['name'] for model in installed_models()}
        except InferenceError:
            raise HTTPException(503, 'Local Ollama is unreachable')
        if body.model not in names:
            raise HTTPException(422, 'Choose an installed model')
        with lock:
            if any(job['status'] == 'running' for job in jobs.values()):
                raise HTTPException(409, 'A local benchmark is already running')
            while len(jobs) >= 50:
                del jobs[next(iter(jobs))]
            job_id = uuid.uuid4().hex
            jobs[job_id] = {'id': job_id, 'model': body.model, 'status': 'running'}
            result = dict(jobs[job_id])
        threading.Thread(target=execute, args=(job_id, body.model), daemon=True).start()
        return result
