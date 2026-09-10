from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, status
from pydantic import ValidationError

from app.core.config import AppSettings, get_settings
from app.presence.schemas import (
    PresenceCellResponse,
    PresenceHeartbeatMessage,
    PresenceJoinMessage,
    PresenceLeaveMessage,
    PresenceMemberResponse,
    PresenceSnapshotMessage,
    PresenceSubscribeMessage,
)
from app.presence.service import PresenceCell, PresenceService, PresenceStore
from app.sessions.router import get_visitor_session_service
from app.sessions.service import SystemClock, VisitorSessionService

router = APIRouter(prefix="/presence", tags=["presence"])
presence_store = PresenceStore()


def get_presence_service(
    settings: Annotated[AppSettings, Depends(get_settings)],
) -> PresenceService:
    return PresenceService(
        clock=SystemClock(),
        store=presence_store,
        ttl_seconds=settings.presence_ttl_seconds,
        cell_size_deg=settings.presence_cell_size_deg,
    )


class PresenceConnectionManager:
    def __init__(self) -> None:
        self._connections: set[WebSocket] = set()

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self._connections.add(websocket)

    def disconnect(self, websocket: WebSocket) -> None:
        self._connections.discard(websocket)

    async def broadcast_snapshot(self, cells: tuple[PresenceCell, ...]) -> None:
        message = serialize_snapshot(cells)

        for websocket in tuple(self._connections):
            try:
                await websocket.send_json(message)
            except RuntimeError:
                self.disconnect(websocket)


connection_manager = PresenceConnectionManager()


@router.websocket("/ws")
async def observe_presence(
    websocket: WebSocket,
    presence_service: Annotated[PresenceService, Depends(get_presence_service)],
    session_service: Annotated[VisitorSessionService, Depends(get_visitor_session_service)],
) -> None:
    await connection_manager.connect(websocket)
    participant_id: UUID | None = None

    try:
        first_payload = await websocket.receive_json()
        if first_payload.get("type") == "subscribe":
            PresenceSubscribeMessage.model_validate(first_payload)
            await websocket.send_json(serialize_snapshot(presence_service.snapshot()))

            while True:
                payload = await websocket.receive_json()
                if payload.get("type") == "leave":
                    PresenceLeaveMessage.model_validate(payload)
                    await websocket.close()
                    return

                await websocket.close(code=status.WS_1003_UNSUPPORTED_DATA)
                return

        join_message = PresenceJoinMessage.model_validate(first_payload)
        session = session_service.find_active(join_message.participant_id)

        if session is None:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        participant_id = join_message.participant_id
        presence_service.join(
            participant_id=participant_id,
            display_name=session.display_name,
            latitude_deg=join_message.latitude_deg,
            longitude_deg=join_message.longitude_deg,
        )
        await connection_manager.broadcast_snapshot(presence_service.snapshot())

        while True:
            payload = await websocket.receive_json()
            message_type = payload.get("type")

            if message_type == "heartbeat":
                PresenceHeartbeatMessage.model_validate(payload)
                presence_service.heartbeat(participant_id)
                await websocket.send_json(serialize_snapshot(presence_service.snapshot()))
            elif message_type == "leave":
                PresenceLeaveMessage.model_validate(payload)
                presence_service.leave(participant_id)
                await connection_manager.broadcast_snapshot(presence_service.snapshot())
                participant_id = None
                await websocket.close()
                return
            else:
                await websocket.close(code=status.WS_1003_UNSUPPORTED_DATA)
                return
    except (ValidationError, KeyError, TypeError):
        await websocket.close(code=status.WS_1003_UNSUPPORTED_DATA)
    except WebSocketDisconnect:
        pass
    finally:
        if participant_id is not None:
            presence_service.leave(participant_id)
            await connection_manager.broadcast_snapshot(presence_service.snapshot())
        connection_manager.disconnect(websocket)


def serialize_snapshot(cells: tuple[PresenceCell, ...]) -> dict[str, object]:
    return PresenceSnapshotMessage(
        cells=[
            PresenceCellResponse(
                cell_id=cell.cell_id,
                latitude_deg=cell.latitude_deg,
                longitude_deg=cell.longitude_deg,
                members=[
                    PresenceMemberResponse(
                        participant_id=member.participant_id,
                        display_name=member.display_name,
                    )
                    for member in cell.members
                ],
            )
            for cell in cells
        ],
    ).model_dump(by_alias=True, mode="json")
