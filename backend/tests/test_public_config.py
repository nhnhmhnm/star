import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.core.config import AppSettings
from app.main import create_app


def test_public_config_returns_shared_client_settings() -> None:
    app = create_app(
        AppSettings(
            night_altitude_threshold_deg=-12.0,
            presence_cell_size_deg=0.5,
            presence_heartbeat_seconds=30,
        ),
    )
    client = TestClient(app)

    response = client.get("/config/public")

    assert response.status_code == 200
    assert response.json() == {
        "nightAltitudeThresholdDeg": -12.0,
        "presenceCellSizeDeg": 0.5,
        "presenceHeartbeatSeconds": 30,
    }


@pytest.mark.parametrize("threshold", [-91.0, 1.0])
def test_night_altitude_threshold_rejects_values_outside_supported_range(
    threshold: float,
) -> None:
    with pytest.raises(ValidationError):
        AppSettings(night_altitude_threshold_deg=threshold)
