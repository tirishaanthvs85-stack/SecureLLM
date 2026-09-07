"""Compatibility exports for provider-neutral inference contracts."""

from core.inference.contracts import (
    InferenceProvider,
    InferenceRequest,
    InferenceResponse,
    InferenceResult,
)

InferenceClient = InferenceProvider

__all__ = ["InferenceClient", "InferenceProvider", "InferenceRequest", "InferenceResponse", "InferenceResult"]
