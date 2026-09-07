"""Framework-neutral API composition placeholder."""
from core.health import health_status
class ApiApplication:
    """Minimal API surface until a web framework is selected."""
    def health(self) -> dict[str, str]:
        return health_status()
