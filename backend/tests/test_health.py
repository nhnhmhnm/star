from fastapi.testclient import TestClient

from app.core.config import AppSettings
from app.main import create_app


def test_health_returns_app_status() -> None:
    app = create_app(
        AppSettings(
            app_name="Test Star API",
            environment="test",
            allowed_origins=["http://localhost:5173"],
        ),
    )
    client = TestClient(app)

    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "appName": "Test Star API",
        "environment": "test",
    }
