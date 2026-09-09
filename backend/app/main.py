from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.configuration.router import router as configuration_router
from app.core.config import AppSettings, get_settings
from app.sessions.router import router as sessions_router


class HealthResponse(BaseModel):
    status: str
    appName: str
    environment: str


def create_app(settings: AppSettings | None = None) -> FastAPI:
    resolved_settings = settings or get_settings()
    app = FastAPI(title=resolved_settings.app_name)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=resolved_settings.allowed_origins,
        allow_credentials=False,
        allow_methods=["GET", "POST"],
        allow_headers=["*"],
    )

    @app.get("/health", response_model=HealthResponse)
    def read_health() -> HealthResponse:
        return HealthResponse(
            status="ok",
            appName=resolved_settings.app_name,
            environment=resolved_settings.environment,
        )

    app.include_router(configuration_router)
    app.include_router(sessions_router)

    return app


app = create_app()
