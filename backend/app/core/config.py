from functools import lru_cache
from typing import Any

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class AppSettings(BaseSettings):
    """Runtime settings loaded once at the FastAPI composition boundary."""

    app_name: str = Field(default="Star API", min_length=1)
    environment: str = Field(default="local", min_length=1)
    allowed_origins: list[str] = Field(
        default_factory=lambda: ["http://localhost:5173", "http://127.0.0.1:5173"],
    )
    night_altitude_threshold_deg: float = Field(default=-18.0, ge=-90.0, le=0.0)
    visitor_session_ttl_seconds: int = Field(default=43_200, ge=60, le=86_400)
    presence_heartbeat_seconds: int = Field(default=20, ge=5, le=120)
    presence_ttl_seconds: int = Field(default=60, ge=10, le=600)
    presence_cell_size_deg: float = Field(default=0.25, gt=0.0, le=5.0)

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @field_validator("allowed_origins", mode="before")
    @classmethod
    def parse_allowed_origins(cls, value: Any) -> Any:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value


@lru_cache
def get_settings() -> AppSettings:
    return AppSettings()
