import re
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

display_name_pattern = re.compile(r"^[가-힣A-Za-z0-9 _-]{2,20}$")
display_name_error_message = (
    "닉네임은 2~20자의 한글, 영문, 숫자, 공백, 밑줄, 하이픈만 사용할 수 있습니다."
)


class VisitorSessionCreateRequest(BaseModel):
    display_name: str = Field(validation_alias="displayName")

    model_config = ConfigDict(populate_by_name=True)

    @field_validator("display_name")
    @classmethod
    def normalize_display_name(cls, value: str) -> str:
        normalized = value.strip()

        if not display_name_pattern.fullmatch(normalized):
            raise ValueError(display_name_error_message)

        return normalized


class VisitorSessionResponse(BaseModel):
    participant_id: UUID = Field(serialization_alias="participantId")
    display_name: str = Field(serialization_alias="displayName")
    expires_at_utc_ms: int = Field(serialization_alias="expiresAtUtcMs")

    model_config = ConfigDict(populate_by_name=True)
