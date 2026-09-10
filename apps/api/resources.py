"""Read-only projections of existing persistence entities; no derived science."""
from fastapi import HTTPException, Query
from sqlalchemy import func, select
from core.persistence import models


RESOURCES = {
    "datasets": models.DatasetEntity,
    "dataset-versions": models.DatasetVersionEntity,
    "models": models.ModelConfigEntity,
    "benchmark-runs": models.BenchmarkRunEntity,
    "evaluations": models.EvaluationResultEntity,
    "layer1-results": models.LayerOneResultEntity,
    "layer2-results": models.LayerTwoResultEntity,
    "scientific-reviews": models.ScientificReviewEntity,
}
FILTERS = {"id", "dataset_id", "version", "model_name", "model_config_id",
           "dataset_version_id", "status", "benchmark_run_id", "case_id",
           "execution_status", "evaluation_result_id", "detector_name", "dimension",
           "claim_id", "evidence_bundle_id", "decision"}


def redact_configuration(value):
    """Configuration and provider metadata may contain credentials."""
    if isinstance(value, dict):
        return {key: ("[REDACTED]" if any(part in key.lower() for part in
                ("secret", "token", "password", "api_key", "apikey", "authorization", "credential"))
                else redact_configuration(item)) for key, item in value.items()}
    if isinstance(value, list):
        return [redact_configuration(item) for item in value]
    return value


def project(row):
    result = {column.name: getattr(row, column.name) for column in row.__table__.columns}
    if isinstance(row, models.ModelConfigEntity):
        result["payload"] = redact_configuration(result["payload"])
    if isinstance(row, models.EvaluationResultEntity):
        result["provider_metadata"] = redact_configuration(result["provider_metadata"])
    return result


def register_resources(app, factory):
    @app.get("/dashboard-summary")
    def summary():
        with factory() as session:
            entities = {**RESOURCES, "scientific-records": models.ScientificRecordEntity}
            return {"counts": {name: session.scalar(select(func.count()).select_from(entity))
                               for name, entity in entities.items()}}

    def register(name, entity):
        allowed = FILTERS.intersection(entity.__table__.columns.keys())

        def listing(limit: int = Query(25, ge=1, le=100), offset: int = Query(0, ge=0),
                    filter_by: str | None = None, value: str | None = None,
                    sort: str = "created_at", direction: str = "asc"):
            if sort not in {"id", "created_at"} or direction not in {"asc", "desc"}:
                raise HTTPException(422, "Invalid sort")
            if (filter_by is None) != (value is None) or (filter_by is not None and filter_by not in allowed):
                raise HTTPException(422, "Invalid filter")
            statement = select(entity)
            if filter_by is not None:
                statement = statement.where(getattr(entity, filter_by) == value)
            with factory() as session:
                total = session.scalar(select(func.count()).select_from(statement.subquery()))
                column = getattr(entity, sort)
                rows = session.scalars(statement.order_by(
                    column.desc() if direction == "desc" else column.asc(), entity.id).limit(limit).offset(offset))
                return {"items": [project(row) for row in rows], "total": total, "limit": limit, "offset": offset}

        def detail(record_id: str):
            with factory() as session:
                row = session.get(entity, record_id)
                if row is None:
                    raise HTTPException(404, "Record not found")
                return project(row)

        app.add_api_route(f"/{name}", listing, methods=["GET"], name=f"list_{name}")
        app.add_api_route(f"/{name}/{{record_id}}", detail, methods=["GET"], name=f"get_{name}")

    for name, entity in RESOURCES.items():
        register(name, entity)
