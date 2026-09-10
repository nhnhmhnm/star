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
The public runtime config is available at `GET /config/public` and includes the
night threshold, presence cell size, and heartbeat interval used by the frontend.
Visitor sessions are created with `POST /sessions/visitors`.

## Environment

`NIGHT_ALTITUDE_THRESHOLD_DEG` controls the solar altitude threshold for sky entry.
The default is `-18`, which means astronomically dark night.
`VISITOR_SESSION_TTL_SECONDS` controls the lifetime of a temporary nickname session.
The default is `43200`, or 12 hours.
`PRESENCE_HEARTBEAT_SECONDS`, `PRESENCE_TTL_SECONDS`, and `PRESENCE_CELL_SIZE_DEG`
control the real-time observation presence heartbeat, server expiry, and approximate
public location grid.

## Quality Checks

```powershell
uv run ruff format --check .
uv run ruff check .
uv run mypy app tests
uv run pytest
```
