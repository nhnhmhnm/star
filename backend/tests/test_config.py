from app.core.config import AppSettings


def test_allowed_origins_accepts_comma_separated_string() -> None:
    settings = AppSettings(
        allowed_origins="http://localhost:5173, http://127.0.0.1:5173",
    )

    assert settings.allowed_origins == [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]
