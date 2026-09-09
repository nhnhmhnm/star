from datetime import UTC, datetime

import pytest
from fastapi.testclient import TestClient

from app.core.config import AppSettings
from app.main import create_app
from app.sessions.service import Clock, InMemoryVisitorSessionStore, VisitorSessionService


class FixedClock:
    def now(self) -> datetime:
        return datetime(2026, 9, 9, 0, 0, tzinfo=UTC)


def test_visitor_session_service_creates_expiring_session() -> None:
    store = InMemoryVisitorSessionStore()
    service = VisitorSessionService(clock=FixedClock(), ttl_seconds=60, store=store)

    session = service.create("별친구")

    assert session.display_name == "별친구"
    assert session.expires_at_utc_ms == 1_788_912_060_000
    assert service.find_active(session.participant_id) == session


def test_visitor_session_store_removes_expired_session() -> None:
    store = InMemoryVisitorSessionStore()
    service = VisitorSessionService(clock=FixedClock(), ttl_seconds=60, store=store)

    session = service.create("별친구")

    assert store.find_active(session.participant_id, 1_788_912_059_999) == session
    assert store.find_active(session.participant_id, 1_788_912_060_000) is None
    assert store.find_active(session.participant_id, 1_788_912_059_999) is None


def test_visitor_session_service_uses_clock_contract() -> None:
    clock: Clock = FixedClock()

    assert clock.now() == datetime(2026, 9, 9, 0, 0, tzinfo=UTC)


def test_create_visitor_session_returns_normalized_nickname() -> None:
    app = create_app(AppSettings(visitor_session_ttl_seconds=60))
    client = TestClient(app)

    response = client.post("/sessions/visitors", json={"displayName": " 별친구 "})

    assert response.status_code == 200
    payload = response.json()
    assert payload["displayName"] == "별친구"
    assert payload["participantId"]
    assert isinstance(payload["expiresAtUtcMs"], int)


@pytest.mark.parametrize(
    "display_name",
    ["a", "a" * 21, "<script>", "별\t친구"],
)
def test_create_visitor_session_rejects_invalid_nickname(display_name: str) -> None:
    app = create_app(AppSettings())
    client = TestClient(app)

    response = client.post("/sessions/visitors", json={"displayName": display_name})

    assert response.status_code == 422
