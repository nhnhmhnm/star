# Real Time Sky Frontend

React, TypeScript, Vite 기반 프론트엔드입니다. 세계지도에서 선택한 좌표가 현재 밤이면 `/sky` 화면에서 Stellarium Web Engine 캔버스를 렌더링합니다.

## Run

Node.js 22.14.0을 사용합니다. Windows PowerShell에서 `npm` 실행 정책 문제가 있으면 `npm.cmd`를 사용합니다.

```powershell
npm install
npm run dev
npm run build
```

개발 서버는 `/config`, `/sessions`, `/presence` 요청을 로컬 FastAPI 서버 `http://127.0.0.1:8000`으로 프록시합니다.

## Stellarium Assets

제품 하늘 화면은 다음 public 경로를 사용합니다.

```text
/stellarium-engine/stellarium-web-engine.js
/stellarium-engine/stellarium-web-engine.wasm
/stellarium-skydata/
/stellarium-fonts/
```

이 산출물은 Git에서 제외됩니다. 로컬에서 C05 실험 자산을 만든 뒤 아래처럼 복사합니다.

```powershell
Copy-Item -Recurse -Force experiments\stellarium\public\stellarium-engine public\stellarium-engine
Copy-Item -Recurse -Force experiments\stellarium\public\stellarium-skydata public\stellarium-skydata
Copy-Item -Recurse -Force experiments\stellarium\public\stellarium-fonts public\stellarium-fonts
```

## Verify

```powershell
npm run lint
npm run test:run
npm run build
```
