"""Explicitly enabled loopback-only execution of installed local models."""
import threading
import uuid
from datetime import datetime, timezone
from typing import Literal
from fastapi import HTTPException, Request
from pydantic import BaseModel, ConfigDict, Field, model_validator
from core.inference.ollama_provider import installed_models
from core.inference.contracts import InferenceError
from core.inference.openai_compatible_provider import normalize_endpoint
from scripts.run_local_benchmark import run_model

SHOWCASE_MODELS = (
    {"id": "gemma3:4b", "name": "Gemma 3 4B", "ollama_model": "gemma3:4b",
     "description": "Open-weight showcase preset for local evaluation.", "access": "Install locally in Ollama to run."},
    {"id": "qwen3.5:2b", "name": "Qwen 3.5 2B", "ollama_model": "qwen3.5:2b",
     "description": "Compact showcase preset for local evaluation.", "access": "Install locally in Ollama to run."},
    {"id": "llama3.2:3b", "name": "Llama 3.2 3B", "ollama_model": "llama3.2:3b",
     "description": "Open-weight showcase preset for local evaluation.", "access": "Install locally in Ollama to run."},
)


class RunInput(BaseModel):
    model_config = ConfigDict(extra='forbid')
    model: str = Field(min_length=1, max_length=200)
    provider: Literal['ollama-local', 'openai-compatible'] = 'ollama-local'
    endpoint: str | None = Field(default=None, max_length=1000)
    api_key: str | None = Field(default=None, max_length=2000, repr=False)

    @model_validator(mode='after')
    def validate_provider_configuration(self):
        if self.provider == 'ollama-local' and (self.endpoint is not None or self.api_key is not None):
            raise ValueError('Local Ollama runs do not accept an endpoint or API key')
        if self.provider == 'openai-compatible':
            if not self.endpoint:
                raise ValueError('An OpenAI-compatible endpoint is required')
            normalize_endpoint(self.endpoint)
        return self


def register_execution(app, database_url, enabled=False, remote_enabled=False):
    jobs = {}
    lock = threading.Lock()

    @app.get('/runtime-models')
    def runtime_models():
        try:
            return {'available': True, 'execution_enabled': enabled, 'items': installed_models()}
        except InferenceError:
            return {'available': False, 'execution_enabled': enabled, 'items': [],
                    'reason': 'Start the local Ollama service to discover installed models.'}

    @app.get('/showcase-models')
    def showcase_models():
        return {'items': list(SHOWCASE_MODELS), 'remote_execution_enabled': remote_enabled,
                'note': 'Showcase entries are presets, not claims that a model is installed, tested, or scientifically validated.'}

    @app.get('/benchmark-jobs')
    def list_jobs():
        with lock:
            return {'items': [dict(job) for job in reversed(list(jobs.values()))]}

    @app.get('/benchmark-jobs/{job_id}')
    def get_job(job_id: str):
        with lock:
            job = jobs.get(job_id)
            if job is None:
                raise HTTPException(404, 'Benchmark job not found in this server session')
            return dict(job)

    def execute(job_id, run_spec):
        def progress(stage, **details):
            with lock:
                jobs[job_id].update(stage=stage, **details)
        try:
            result = run_model(database_url=database_url, run_id=job_id, progress_callback=progress, **run_spec)
            with lock:
                jobs[job_id].update(status=result['status'], stage='Completed and persisted', result=result,
                                    completed_at=datetime.now(timezone.utc).isoformat())
        except Exception:
            with lock:
                jobs[job_id].update(status='failed', stage='Failed before persistence', completed_at=datetime.now(timezone.utc).isoformat(),
                                    error='Execution or persistence failed. Inspect local service logs and saved run artifacts.')

    @app.post('/internal/benchmark-jobs', status_code=202)
    def create_job(body: RunInput, request: Request):
        if not enabled:
            raise HTTPException(403, 'Local benchmark execution is disabled')
        if request.client is None or request.client.host not in {'127.0.0.1', '::1'}:
            raise HTTPException(403, 'Local execution requires a loopback connection')
        if request.headers.get('X-SecureLLM-Local') != '1' or request.headers.get('origin') not in {
            None, 'http://127.0.0.1:5173', 'http://localhost:5173', 'http://127.0.0.1:8000'}:
            raise HTTPException(403, 'Invalid local execution request')
        if body.provider == 'ollama-local':
            try:
                names = {model['name'] for model in installed_models()}
            except InferenceError:
                raise HTTPException(503, 'Local Ollama is unreachable')
            if body.model not in names:
                raise HTTPException(422, 'Choose an installed model')
        if body.provider == 'openai-compatible' and not remote_enabled:
            raise HTTPException(403, 'Remote model execution is disabled on this server')
        with lock:
            if any(job['status'] == 'running' for job in jobs.values()):
                raise HTTPException(409, 'A local benchmark is already running')
            while len(jobs) >= 50:
                del jobs[next(iter(jobs))]
            job_id = uuid.uuid4().hex
            jobs[job_id] = {'id': job_id, 'model': body.model, 'provider': body.provider, 'status': 'running',
                            'stage': 'Job accepted; preparing benchmark source', 'submitted_at': datetime.now(timezone.utc).isoformat()}
            result = dict(jobs[job_id])
        run_spec = {'model_name': body.model, 'provider_kind': body.provider}
        if body.provider == 'openai-compatible':
            run_spec.update(endpoint=body.endpoint, api_key=body.api_key)
        threading.Thread(target=execute, args=(job_id, run_spec), daemon=True).start()
        return result
