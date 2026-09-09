from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from threading import Lock
from typing import Protocol
from uuid import UUID, uuid4


class Clock(Protocol):
    def now(self) -> datetime: ...


class SystemClock:
    def now(self) -> datetime:
        return datetime.now(UTC)


@dataclass(frozen=True)
class VisitorSession:
    participant_id: UUID
    display_name: str
    expires_at_utc_ms: int


class VisitorSessionStore(Protocol):
    def save(self, session: VisitorSession) -> None: ...

    def find_active(self, participant_id: UUID, now_utc_ms: int) -> VisitorSession | None: ...


class InMemoryVisitorSessionStore:
    """방문 세션을 단일 서버 프로세스 메모리에 보관하는 첫 구현입니다."""

    def __init__(self) -> None:
        self._sessions: dict[UUID, VisitorSession] = {}
        self._lock = Lock()

    def save(self, session: VisitorSession) -> None:
        with self._lock:
            self._sessions[session.participant_id] = session

    def find_active(self, participant_id: UUID, now_utc_ms: int) -> VisitorSession | None:
        with self._lock:
            session = self._sessions.get(participant_id)

            if session is None:
                return None

            if session.expires_at_utc_ms <= now_utc_ms:
                del self._sessions[participant_id]
                return None

            return session


class VisitorSessionService:
    def __init__(self, clock: Clock, ttl_seconds: int, store: VisitorSessionStore) -> None:
        self._clock = clock
        self._ttl_seconds = ttl_seconds
        self._store = store

    def create(self, display_name: str) -> VisitorSession:
        expires_at = self._clock.now() + timedelta(seconds=self._ttl_seconds)
        session = VisitorSession(
            participant_id=uuid4(),
            display_name=display_name,
            expires_at_utc_ms=int(expires_at.timestamp() * 1000),
        )

        self._store.save(session)

        return session

    def find_active(self, participant_id: UUID) -> VisitorSession | None:
        return self._store.find_active(
            participant_id=participant_id,
            now_utc_ms=int(self._clock.now().timestamp() * 1000),
        )
