from typing import Annotated

from fastapi import APIRouter, Depends

from app.core.config import AppSettings, get_settings
from app.sessions.schemas import VisitorSessionCreateRequest, VisitorSessionResponse
from app.sessions.service import (
    InMemoryVisitorSessionStore,
    SystemClock,
    VisitorSessionService,
)

router = APIRouter(prefix="/sessions", tags=["sessions"])
visitor_session_store = InMemoryVisitorSessionStore()


def get_visitor_session_service(
    settings: Annotated[AppSettings, Depends(get_settings)],
) -> VisitorSessionService:
    return VisitorSessionService(
        clock=SystemClock(),
        store=visitor_session_store,
        ttl_seconds=settings.visitor_session_ttl_seconds,
    )


@router.post("/visitors", response_model=VisitorSessionResponse)
def create_visitor_session(
    payload: VisitorSessionCreateRequest,
    service: Annotated[VisitorSessionService, Depends(get_visitor_session_service)],
) -> VisitorSessionResponse:
    session = service.create(payload.display_name)

    return VisitorSessionResponse(
        participant_id=session.participant_id,
        display_name=session.display_name,
        expires_at_utc_ms=session.expires_at_utc_ms,
    )
