"""Deterministic inference provider for CPU-only tests and local development."""

import logging
from time import perf_counter, sleep
from typing import Mapping

from core.inference.contracts import InferenceRequest, InferenceResult, InferenceTimeoutError, TokenUsage

logger = logging.getLogger(__name__)


class MockInferenceProvider:
    """Returns configured prompt responses without model downloads or network I/O."""

    provider_name = "mock"

    def __init__(self, responses: Mapping[str, str] | None = None, *, default_response: str = "mock response", delay_seconds: float = 0.0) -> None:
        if delay_seconds < 0:
            raise ValueError("delay_seconds must be non-negative")
        self._responses = dict(responses or {})
        self._default_response = default_response
        self._delay_seconds = delay_seconds

    def generate(self, request: InferenceRequest) -> InferenceResult:
        timeout = request.generation.timeout_seconds
        if timeout is not None and self._delay_seconds > timeout:
            logger.warning("Mock inference timeout for model %s", request.model.name)
            raise InferenceTimeoutError(f"Mock provider exceeded timeout of {timeout} seconds")
        started = perf_counter()
        if self._delay_seconds:
            sleep(self._delay_seconds)
        text = self._responses.get(request.prompt, self._default_response)
        logger.debug("Mock inference completed for model %s", request.model.name)
        return InferenceResult(
            text=text, model=request.model, provider=self.provider_name,
            latency_ms=(perf_counter() - started) * 1000,
            token_usage=TokenUsage(input_tokens=None, output_tokens=None, total_tokens=None),
            finish_reason="mock", metadata={"deterministic": True},
        )
