# Real Time Sky

세계지도에서 지금 천문학적으로 밤인 위치를 선택하고, 그 장소의 현재 하늘을 함께 감상하는 개인 웹 프로젝트입니다.

시간은 항상 현재 UTC를 따릅니다. 사용자가 시간을 멈추거나 배속을 바꾸거나 과거·미래로 이동하는 기능은 두지 않습니다. 기본 관측 기준은 태양 중심의 기하 고도 `-18° 이하`이며 백엔드 환경 변수로 변경할 수 있습니다.

## 현재 구현 상태

- 닉네임으로 임시 방문 세션 생성
- 확대·축소·드래그와 클릭 좌표 선택이 가능한 정적 세계지도
- 로컬 장소 검색 결과로 지도 이동
- 현재 태양 고도에 따른 낮·박명·밤 음영과 동일한 밤 상태색
- 밤인 좌표에서만 하늘 페이지 진입
- WebSocket 기반 관측 상태와 0.25° 기본 격자의 관측자 핀
- Stellarium Web Engine의 좌표·현재 시각·대기·별자리 렌더링 실험 완료

정식 하늘 페이지의 Stellarium 연결은 아직 진행 중입니다. 현재 하늘 페이지에는 선택 좌표와 관측 상태가 표시됩니다.

## 기술 구성

- 프론트엔드: TypeScript, React, Vite
- 백엔드: Python, FastAPI, Pydantic
- 실시간 상태: WebSocket, 프로세스 메모리 TTL 저장소
- 하늘 렌더링: Stellarium Web Engine JS/WASM

구성 요소와 데이터 흐름은 [서비스 구조](./docs/architecture.md)에 정리되어 있습니다.

## 로컬 실행

Node.js 22.14.0, Python 3.13, [uv](https://docs.astral.sh/uv/)가 필요합니다.

백엔드:

```powershell
cd backend
python -m uv sync
python -m uv run uvicorn app.main:app --reload
```

프론트엔드:

```powershell
cd frontend
npm install
npm run dev
```

브라우저에서 `http://localhost:5173`을 엽니다. Vite 개발 서버가 `/config`, `/sessions`, `/presence` 요청을 `http://127.0.0.1:8000`으로 전달합니다.

## 주요 환경 변수

`backend/.env.example`을 `backend/.env`로 복사해 로컬 값을 변경할 수 있습니다.

| 변수 | 기본값 | 역할 |
| --- | ---: | --- |
| `NIGHT_ALTITUDE_THRESHOLD_DEG` | `-18` | 밤하늘 진입 태양 고도 경계 |
| `VISITOR_SESSION_TTL_SECONDS` | `43200` | 닉네임 방문 세션 수명 |
| `PRESENCE_HEARTBEAT_SECONDS` | `20` | 관측 상태 갱신 간격 |
| `PRESENCE_TTL_SECONDS` | `60` | 끊긴 관측 상태의 서버 만료 시간 |
| `PRESENCE_CELL_SIZE_DEG` | `0.25` | 지도에 공개할 근사 위치 격자 크기 |

## 검증

```powershell
cd frontend
npm run lint
npm run test:run
npm run build
```

```powershell
cd backend
python -m uv run ruff format --check .
python -m uv run ruff check .
python -m uv run mypy app tests scripts
python -m uv run pytest
```

## 데이터 범위

계정과 관측 이력은 저장하지 않습니다. 닉네임 세션과 관측자 위치는 단일 백엔드 프로세스의 메모리에만 보관되며 서버가 재시작되면 사라집니다. 정확한 클릭 좌표는 관측자 API에 보내지 않고, 프론트엔드와 백엔드에서 설정된 격자 중심으로 각각 정규화합니다.

이 저장소는 로컬 실행과 소수 사용자 이용을 기준으로 하며 유료 지도·검색 서비스를 기본 구성에 포함하지 않습니다.
