from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class PresenceJoinMessage(BaseModel):
    type: Literal["join"]
    participant_id: UUID = Field(validation_alias="participantId")
    latitude_deg: float = Field(validation_alias="latitudeDeg", ge=-90, le=90)
    longitude_deg: float = Field(validation_alias="longitudeDeg", ge=-180, le=180)

    model_config = ConfigDict(populate_by_name=True)


class PresenceHeartbeatMessage(BaseModel):
    type: Literal["heartbeat"]


class PresenceLeaveMessage(BaseModel):
    type: Literal["leave"]


class PresenceMemberResponse(BaseModel):
    participant_id: UUID = Field(serialization_alias="participantId")
    display_name: str = Field(serialization_alias="displayName")

    model_config = ConfigDict(populate_by_name=True)


class PresenceCellResponse(BaseModel):
    cell_id: str = Field(serialization_alias="cellId")
    latitude_deg: float = Field(serialization_alias="latitudeDeg")
    longitude_deg: float = Field(serialization_alias="longitudeDeg")
    members: list[PresenceMemberResponse]

    model_config = ConfigDict(populate_by_name=True)


class PresenceSnapshotMessage(BaseModel):
    type: Literal["snapshot"] = "snapshot"
    cells: list[PresenceCellResponse]
