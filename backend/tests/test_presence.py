from datetime import UTC, datetime, timedelta
from uuid import uuid4

from fastapi.testclient import TestClient

from app.core.config import AppSettings
from app.main import create_app
from app.presence.service import PresenceService, PresenceStore, quantize_coordinate


class MutableClock:
    def __init__(self) -> None:
        self.current = datetime(2026, 9, 10, 0, 0, tzinfo=UTC)

    def now(self) -> datetime:
        return self.current

    def advance(self, seconds: int) -> None:
        self.current += timedelta(seconds=seconds)


def test_quantize_coordinate_to_cell_center() -> None:
    assert quantize_coordinate(37.5665, 0.25, -90, 90) == 37.5
    assert quantize_coordinate(126.978, 0.25, -180, 180) == 127.0


def test_presence_service_groups_members_and_expires_ttl() -> None:
    clock = MutableClock()
    store = PresenceStore()
    service = PresenceService(clock=clock, store=store, ttl_seconds=60, cell_size_deg=0.25)
    participant_id = uuid4()

    service.join(
        participant_id=participant_id,
        display_name="별친구",
        latitude_deg=37.5665,
        longitude_deg=126.978,
    )

    snapshot = service.snapshot()

    assert len(snapshot) == 1
    assert snapshot[0].latitude_deg == 37.5
    assert snapshot[0].longitude_deg == 127.0
    assert snapshot[0].members[0].display_name == "별친구"

    clock.advance(61)

    assert service.snapshot() == ()


def test_presence_websocket_accepts_active_visitor_session() -> None:
    app = create_app(AppSettings(presence_ttl_seconds=60, presence_cell_size_deg=0.25))
    client = TestClient(app)
    session_response = client.post("/sessions/visitors", json={"displayName": " 별친구 "})
    participant_id = session_response.json()["participantId"]

    with client.websocket_connect("/presence/ws") as websocket:
        websocket.send_json(
            {
                "type": "join",
                "participantId": participant_id,
                "latitudeDeg": 37.5665,
                "longitudeDeg": 126.978,
            },
        )
        snapshot = websocket.receive_json()

        assert snapshot["type"] == "snapshot"
        assert snapshot["cells"][0]["latitudeDeg"] == 37.5
        assert snapshot["cells"][0]["longitudeDeg"] == 127.0
        assert snapshot["cells"][0]["members"][0]["displayName"] == "별친구"

        websocket.send_json({"type": "heartbeat"})

        assert websocket.receive_json()["type"] == "snapshot"

        websocket.send_json({"type": "leave"})


def test_presence_websocket_subscribe_receives_snapshots_without_joining() -> None:
    app = create_app(AppSettings(presence_ttl_seconds=60, presence_cell_size_deg=0.25))
    client = TestClient(app)

    with client.websocket_connect("/presence/ws") as websocket:
        websocket.send_json({"type": "subscribe"})
        snapshot = websocket.receive_json()

        assert snapshot == {"type": "snapshot", "cells": []}

        websocket.send_json({"type": "leave"})
