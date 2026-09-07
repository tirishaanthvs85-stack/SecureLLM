# SecureLLMBench

SecureLLMBench is a modular framework for benchmarking the security and safety
properties of large language models. This initial repository establishes the
application boundaries and contracts; it intentionally does not contain research
algorithms, model integrations, a database, or a dashboard.

## Requirements

- Python 3.11 or later

## Quick start

```powershell
python -m unittest discover -s tests -p "test_*.py"
python -m scripts.smoke_check
```

## Architecture

The `core` package contains framework-independent application contracts and
orchestration boundaries. Infrastructure adapters (model providers, file formats,
web frameworks, databases) should depend on these contracts, not the reverse.
See [docs/architecture.md](docs/architecture.md) for the intended direction of
dependencies.

## Project status

This is a repository skeleton. Public interfaces are deliberately small and are
expected to evolve alongside the research design.

## Dataset ingestion

The dataset subsystem supports JSON, JSONL, and CSV through source adapters and
normalizes data into the `Dataset` and `DatasetRecord` schemas. Records accept
optional `id`, `prompt`, `category`, `attack_type`, `source`, `language`,
`difficulty`, and `metadata` fields; each record must provide an `id` or a
`prompt`. See the module docstrings in `core/dataset/` for the supported APIs.

## Semantic dataset analysis

Install CPU-compatible optional dependencies when semantic embeddings or DBSCAN
clustering are required:

```powershell
pip install -e ".[semantic]"
```

`hdbscan` remains separate and optional: `pip install -e ".[semantic,hdbscan]"`.
The DQI is an exploratory, configurable research metric; it is **not** a
scientifically validated dataset-quality score.

Run the dependency-free end-to-end processor:

```powershell
python -m scripts.process_dataset data/raw/example.json
```

## Model registry and inference

`ModelMetadata`, `ModelRegistry`, and `InferenceProvider` keep benchmark code
provider-neutral. The deterministic `MockInferenceProvider` runs entirely on CPU
with no model download. The optional local Transformers adapter is lazy-loaded,
uses CPU by default, and uses `local_files_only=True` by default:

```powershell
pip install -e ".[transformers]"
```

Remote/API providers are represented by the `ApiInferenceProvider` protocol; no
remote provider is implemented yet.
