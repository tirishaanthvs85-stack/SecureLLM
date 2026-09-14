"""Minimal OpenAI-compatible inference adapter with ephemeral credentials."""
from __future__ import annotations

import json
import socket
from time import perf_counter
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit
from urllib.request import Request, urlopen

from core.inference.contracts import InferenceError, InferenceResult, InferenceTimeoutError, TokenUsage


LOCAL_ENDPOINT_HOSTS = {"127.0.0.1", "::1", "localhost"}


def normalize_endpoint(value: str) -> str:
    """Accept a base URL or chat-completions URL without permitting credentials in it."""
    parsed = urlsplit(value.strip())
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise ValueError("Endpoint must be an absolute http(s) URL")
    if parsed.username or parsed.password or parsed.query or parsed.fragment:
        raise ValueError("Endpoint must not contain credentials, query parameters, or fragments")
    if parsed.scheme == "http" and parsed.hostname not in LOCAL_ENDPOINT_HOSTS:
        raise ValueError("Use HTTPS for remote endpoints; HTTP is allowed only for a local endpoint")
    path = parsed.path.rstrip("/")
    if path.endswith("/chat/completions"):
        return f"{parsed.scheme}://{parsed.netloc}{path}"
    if path.endswith("/v1"):
        return f"{parsed.scheme}://{parsed.netloc}{path}/chat/completions"
    return f"{parsed.scheme}://{parsed.netloc}{path}/v1/chat/completions"


class OpenAICompatibleProvider:
    """One-request-at-a-time provider. API keys are kept only on this instance."""

    provider_name = "openai-compatible"

    def __init__(self, endpoint: str, *, api_key: str | None = None) -> None:
        self.endpoint = normalize_endpoint(endpoint)
        self._api_key = api_key

    def generate(self, request):
        body = {
            "model": request.model.name,
            "messages": [{"role": "user", "content": request.prompt}],
            "temperature": request.generation.temperature,
            "max_tokens": request.generation.resolved_max_new_tokens,
        }
        headers = {"Content-Type": "application/json"}
        if self._api_key:
            headers["Authorization"] = f"Bearer {self._api_key}"
        started = perf_counter()
        try:
            with urlopen(Request(self.endpoint, data=json.dumps(body).encode(), headers=headers),
                         timeout=request.generation.timeout_seconds or 180) as response:
                value = json.load(response)
        except (TimeoutError, socket.timeout) as exc:
            raise InferenceTimeoutError("OpenAI-compatible generation timed out") from exc
        except HTTPError as exc:
            raise InferenceError(f"OpenAI-compatible endpoint returned HTTP {exc.code}") from exc
        except (URLError, ValueError) as exc:
            raise InferenceError("OpenAI-compatible generation failed") from exc
        try:
            choice = value["choices"][0]
            content = choice["message"]["content"]
            if not isinstance(content, str):
                raise TypeError("message content is not text")
            usage = value.get("usage") or {}
            token_usage = TokenUsage(usage.get("prompt_tokens"), usage.get("completion_tokens"), usage.get("total_tokens"))
        except (KeyError, IndexError, TypeError) as exc:
            raise InferenceError("OpenAI-compatible endpoint returned an invalid response") from exc
        return InferenceResult(
            content, request.model, self.provider_name, (perf_counter() - started) * 1000,
            token_usage, choice.get("finish_reason"),
            {"endpoint": self.endpoint, "response_model": value.get("model")},
        )
