# Star Backend

Python + FastAPI backend for public app settings, visitor sessions, presence, and future API proxy work.

## Requirements

- Python 3.13
- uv

## Setup

```powershell
uv sync
```

If your terminal does not find `uv` after installation, use:

```powershell
python -m uv sync
```

## Run

```powershell
uv run uvicorn app.main:app --reload
```

The API health check is available at `GET /health`.

## Quality Checks

```powershell
uv run ruff format --check .
uv run ruff check .
uv run mypy app tests
uv run pytest
```
