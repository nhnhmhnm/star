from dataclasses import dataclass
from datetime import datetime
from threading import Lock
from uuid import UUID

from app.sessions.service import Clock


@dataclass(frozen=True)
class PresenceMember:
    participant_id: UUID
    display_name: str
    cell_latitude_deg: float
    cell_longitude_deg: float
    last_seen_utc_ms: int


@dataclass(frozen=True)
class PresenceCell:
    cell_id: str
    latitude_deg: float
    longitude_deg: float
    members: tuple[PresenceMember, ...]


class PresenceStore:
    """관측 중 상태를 단일 서버 프로세스 메모리에 TTL로 보관합니다."""

    def __init__(self) -> None:
        self._members: dict[UUID, PresenceMember] = {}
        self._lock = Lock()

    def upsert(self, member: PresenceMember) -> None:
        with self._lock:
            self._members[member.participant_id] = member

    def remove(self, participant_id: UUID) -> None:
        with self._lock:
            self._members.pop(participant_id, None)

    def heartbeat(self, participant_id: UUID, now_utc_ms: int) -> None:
        with self._lock:
            member = self._members.get(participant_id)

            if member is None:
                return

            self._members[participant_id] = PresenceMember(
                participant_id=member.participant_id,
                display_name=member.display_name,
                cell_latitude_deg=member.cell_latitude_deg,
                cell_longitude_deg=member.cell_longitude_deg,
                last_seen_utc_ms=now_utc_ms,
            )

    def snapshot(self, now_utc_ms: int, ttl_seconds: int) -> tuple[PresenceCell, ...]:
        expires_before_ms = now_utc_ms - ttl_seconds * 1000

        with self._lock:
            expired_ids = [
                participant_id
                for participant_id, member in self._members.items()
                if member.last_seen_utc_ms <= expires_before_ms
            ]

            for participant_id in expired_ids:
                del self._members[participant_id]

            grouped: dict[str, list[PresenceMember]] = {}

            for member in self._members.values():
                grouped.setdefault(
                    create_cell_id(member.cell_latitude_deg, member.cell_longitude_deg),
                    [],
                ).append(member)

            return tuple(
                PresenceCell(
                    cell_id=cell_id,
                    latitude_deg=members[0].cell_latitude_deg,
                    longitude_deg=members[0].cell_longitude_deg,
                    members=tuple(sorted(members, key=lambda item: item.display_name)),
                )
                for cell_id, members in sorted(grouped.items())
            )


class PresenceService:
    def __init__(
        self,
        clock: Clock,
        store: PresenceStore,
        ttl_seconds: int,
        cell_size_deg: float,
    ) -> None:
        self._clock = clock
        self._store = store
        self._ttl_seconds = ttl_seconds
        self._cell_size_deg = cell_size_deg

    def join(
        self,
        participant_id: UUID,
        display_name: str,
        latitude_deg: float,
        longitude_deg: float,
    ) -> None:
        cell_latitude_deg = quantize_coordinate(latitude_deg, self._cell_size_deg, -90.0, 90.0)
        cell_longitude_deg = quantize_coordinate(
            normalize_longitude(longitude_deg),
            self._cell_size_deg,
            -180.0,
            180.0,
        )

        self._store.upsert(
            PresenceMember(
                participant_id=participant_id,
                display_name=display_name,
                cell_latitude_deg=cell_latitude_deg,
                cell_longitude_deg=cell_longitude_deg,
                last_seen_utc_ms=to_epoch_ms(self._clock.now()),
            ),
        )

    def heartbeat(self, participant_id: UUID) -> None:
        self._store.heartbeat(participant_id, to_epoch_ms(self._clock.now()))

    def leave(self, participant_id: UUID) -> None:
        self._store.remove(participant_id)

    def snapshot(self) -> tuple[PresenceCell, ...]:
        return self._store.snapshot(to_epoch_ms(self._clock.now()), self._ttl_seconds)


def quantize_coordinate(
    value: float, cell_size_deg: float, minimum: float, maximum: float
) -> float:
    quantized = round(value / cell_size_deg) * cell_size_deg
    return min(max(quantized, minimum), maximum)


def normalize_longitude(longitude_deg: float) -> float:
    normalized = ((((longitude_deg + 180) % 360) + 360) % 360) - 180
    return 0.0 if normalized == -0.0 else normalized


def create_cell_id(latitude_deg: float, longitude_deg: float) -> str:
    return f"{latitude_deg:.4f}:{longitude_deg:.4f}"


def to_epoch_ms(value: datetime) -> int:
    return int(value.timestamp() * 1000)
