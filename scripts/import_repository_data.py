"""Import the existing example input losslessly; never generate result artifacts."""
import hashlib
import json
from pathlib import Path
from sqlalchemy.orm import Session
from core.dataset.loaders import JsonDatasetLoader
from core.persistence.database import Base, make_engine
from core.persistence.models import DatasetEntity, DatasetVersionEntity

ROOT = Path(__file__).resolve().parents[1]


def import_example(session, source=ROOT / "data/raw/example.json"):
    raw = source.read_bytes()
    domain = JsonDatasetLoader().load(source)
    payload = json.loads(raw)
    digest = hashlib.sha256(raw).hexdigest()
    dataset_id = "repository:example"
    version_id = f"{dataset_id}:{digest}"
    with session.begin():
        dataset = session.get(DatasetEntity, dataset_id)
        if dataset is None:
            session.add(DatasetEntity(id=dataset_id, name=domain.metadata.name,
                description="Repository example input; engineering-only, not a validated research corpus.",
                provenance={"source": "data/raw/example.json", "kind": "repository_example",
                            "scientifically_validated": False, "importer": "scripts.import_repository_data"}))
            session.flush()
        existing = session.get(DatasetVersionEntity, version_id)
        if existing is not None:
            if existing.payload != payload or existing.content_hash != digest:
                raise ValueError("Existing snapshot differs; append-only import refused")
            return {"imported": False, "sha256": digest, "source_records": len(domain.records)}
        session.add(DatasetVersionEntity(id=version_id, dataset_id=dataset_id,
            version=domain.metadata.version.version, content_hash=digest, payload=payload))
    return {"imported": True, "sha256": digest, "source_records": len(domain.records)}


def main():
    engine = make_engine(f"sqlite:///{ROOT / 'securellmbench.db'}")
    Base.metadata.create_all(engine)
    with Session(engine) as session:
        print(json.dumps(import_example(session)))


if __name__ == "__main__":
    main()
