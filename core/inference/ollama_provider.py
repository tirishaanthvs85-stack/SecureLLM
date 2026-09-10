"""Local Ollama adapter. Uses installed models only; never pulls model weights."""
import json
import socket
from time import perf_counter
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen
from core.inference.contracts import InferenceError, InferenceTimeoutError, InferenceResult, TokenUsage

ENDPOINT = 'http://127.0.0.1:11434'


def installed_models():
    try:
        with urlopen(ENDPOINT + '/api/tags', timeout=5) as response:
            return json.load(response)['models']
    except (OSError, ValueError, KeyError) as exc:
        raise InferenceError('Local Ollama is unreachable or returned invalid model metadata') from exc


class OllamaProvider:
    provider_name = 'ollama-local'

    def __init__(self, *, seed=2026):
        self.seed = seed

    def generate(self, request):
        options = {'temperature': request.generation.temperature,
                   'num_predict': request.generation.resolved_max_new_tokens, 'seed': self.seed}
        body = {'model': request.model.name, 'prompt': request.prompt, 'stream': False,
                'options': options, 'keep_alive': '5m'}
        if 'thinking' in request.model.capabilities:
            body['think'] = False
        started = perf_counter()
        try:
            with urlopen(Request(ENDPOINT + '/api/generate', data=json.dumps(body).encode(),
                                 headers={'Content-Type': 'application/json'}),
                         timeout=request.generation.timeout_seconds or 180) as response:
                value = json.load(response)
            if value.get('done') is not True or not isinstance(value.get('response'), str):
                raise InferenceError('Ollama returned an incomplete or invalid response')
            counts = [value.get('prompt_eval_count'), value.get('eval_count')]
            if any(v is not None and (type(v) is not int or v < 0) for v in counts):
                raise InferenceError('Ollama returned invalid token counts')
        except (TimeoutError, socket.timeout) as exc:
            raise InferenceTimeoutError('Local Ollama generation timed out') from exc
        except HTTPError as exc:
            raise InferenceError(f'Local Ollama returned HTTP {exc.code}') from exc
        except (URLError, ValueError) as exc:
            raise InferenceError('Local Ollama generation failed') from exc
        return InferenceResult(value['response'], request.model, self.provider_name,
            (perf_counter() - started) * 1000,
            TokenUsage(*counts, sum(counts) if all(v is not None for v in counts) else None),
            value.get('done_reason'),
            {**{key: value.get(key) for key in ('model', 'created_at', 'total_duration', 'load_duration', 'eval_duration', 'prompt_eval_duration')},
             'options': options, 'thinking_enabled': body.get('think'), 'model_digest': request.model.version})
