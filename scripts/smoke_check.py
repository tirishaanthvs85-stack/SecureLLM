"""Run a dependency-free application smoke check from the repository root."""
from apps.api.app import ApiApplication
if __name__ == "__main__":
    print(ApiApplication().health())
