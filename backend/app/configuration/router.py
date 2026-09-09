from typing import Annotated

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.core.config import AppSettings, get_settings

router = APIRouter(prefix="/config", tags=["config"])


class PublicConfigResponse(BaseModel):
    nightAltitudeThresholdDeg: float


@router.get("/public", response_model=PublicConfigResponse)
def read_public_config(
    settings: Annotated[AppSettings, Depends(get_settings)],
) -> PublicConfigResponse:
    return PublicConfigResponse(
        nightAltitudeThresholdDeg=settings.night_altitude_threshold_deg,
    )
