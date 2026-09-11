# Real Time Sky

세계지도에서 현재 천문학적으로 밤인 위치를 선택하고, 그 장소의 현재 밤하늘을 Stellarium Web Engine으로 감상하는 개인 로컬 프로젝트입니다.

시간은 항상 현재 UTC를 사용합니다. 사용자가 시간을 멈추거나, 배속을 바꾸거나, 과거와 미래로 이동하는 기능은 제공하지 않습니다. 기본 관측 기준은 태양 중심의 지평 고도 `-18° 이하`이며, 백엔드 환경 변수로 변경할 수 있습니다.

## Current State

- 별도 로그인이나 닉네임 입력 없이 세계지도에 바로 입장
- Leaflet/OpenStreetMap 기반 태평양 중심 세계지도, 검색 결과 이동, 클릭 좌표 선택
- 한국어/영어 장소 표시 전환
- 좌우 반복과 남북 범위 이탈을 제한한 세계지도 뷰포트
- 현재 태양 고도 기반 낮/박명/밤 지도 음영 표시
- 선택 좌표의 현재 밤하늘 Stellarium 렌더링
- Stellarium 기본 성도, 서양 sky culture 별자리 선과 이름 표시

## Stack

- Frontend: TypeScript, React, Vite
- Backend: Python, FastAPI, Pydantic
- Map: Leaflet, OpenStreetMap raster tiles
- Sky renderer: Stellarium Web Engine JS/WASM

## Local Run

Node.js 22.14.0, Python 3.13, [uv](https://docs.astral.sh/uv/)가 필요합니다.

Backend:

```powershell
cd backend
python -m uv sync
python -m uv run uvicorn app.main:app --reload
```

Frontend:

```powershell
cd frontend
npm install
npm run dev
```

브라우저에서 `http://localhost:5173`을 엽니다. Vite 개발 서버는 `/config` 요청을 `http://127.0.0.1:8000`으로 전달합니다.

세계지도 배경은 OpenStreetMap 타일을 사용합니다. 로컬 실행 중 인터넷 연결이 없으면 지도 타일 배경은 보이지 않을 수 있지만, 지도 좌표 선택 UI와 서버 기능은 그대로 실행됩니다.

## Stellarium Assets

Stellarium JS/WASM, skydata, font 산출물은 라이선스와 배포 방식을 따로 관리하기 위해 Git에 올리지 않습니다. 로컬 실행 전에 C05 실험에서 만든 자산을 제품 public 경로로 복사합니다.

```powershell
Copy-Item -Recurse -Force frontend\experiments\stellarium\public\stellarium-engine frontend\public\stellarium-engine
Copy-Item -Recurse -Force frontend\experiments\stellarium\public\stellarium-skydata frontend\public\stellarium-skydata
Copy-Item -Recurse -Force frontend\experiments\stellarium\public\stellarium-fonts frontend\public\stellarium-fonts
```

자산이 없으면 밤하늘 페이지는 Stellarium 엔진 로딩 오류를 표시합니다.

## Config

`backend/.env.example`을 `backend/.env`로 복사해 로컬 값을 바꿀 수 있습니다.

| Variable | Default | Role |
| --- | ---: | --- |
| `NIGHT_ALTITUDE_THRESHOLD_DEG` | `-18` | 밤하늘 진입 태양 고도 기준 |
| `VISITOR_SESSION_TTL_SECONDS` | `43200` | 현재 화면에서는 사용하지 않는 방문 세션 수명 |
| `PRESENCE_HEARTBEAT_SECONDS` | `20` | 현재 화면에서는 사용하지 않는 관측 상태 갱신 간격 |
| `PRESENCE_TTL_SECONDS` | `60` | 현재 화면에서는 사용하지 않는 관측 상태 만료 시간 |
| `PRESENCE_CELL_SIZE_DEG` | `0.25` | 현재 화면에서는 사용하지 않는 근사 위치 격자 크기 |

## Verification

Frontend:

```powershell
cd frontend
npm run lint
npm run test:run
npm run build
```

Backend:

```powershell
cd backend
python -m uv run ruff format --check .
python -m uv run ruff check .
python -m uv run mypy app tests scripts
python -m uv run pytest
```

## Data Scope

현재 화면 흐름에서는 계정, 닉네임, 관측 이력, 관측자 위치를 저장하지 않습니다. 사용자는 세계지도에서 좌표를 선택하고, 그 좌표가 현재 기준으로 천문학적 밤이면 밤하늘 페이지로 이동합니다.
