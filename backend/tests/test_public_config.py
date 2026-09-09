import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.core.config import AppSettings
from app.main import create_app


def test_public_config_returns_night_altitude_threshold() -> None:
    app = create_app(
        AppSettings(
            night_altitude_threshold_deg=-18.0,
        ),
    )
    client = TestClient(app)

    response = client.get("/config/public")

    assert response.status_code == 200
    assert response.json() == {"nightAltitudeThresholdDeg": -18.0}


@pytest.mark.parametrize("threshold", [-91.0, 1.0])
def test_night_altitude_threshold_rejects_values_outside_supported_range(
    threshold: float,
) -> None:
    with pytest.raises(ValidationError):
        AppSettings(night_altitude_threshold_deg=threshold)
