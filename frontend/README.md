# Real Time Sky Frontend

React, TypeScript, Vite 기반의 웹 앱이다. 제품 요구사항과 구현 순서는 루트의 `docs` 문서를 따른다.

## 실행

Node.js는 루트의 `.nvmrc`와 `.node-version`에 적힌 22.14.0을 사용한다. Windows PowerShell에서 `npm` 실행 정책 오류가 나면 `npm.cmd`를 사용한다.

```bash
npm install
npm run dev
npm run build
```

현재 정적 세계지도, 장소 검색, 밤 판정, 관측 위치 선택과 presence 핀이 구현되어 있다. Stellarium Web Engine 제품 연결 전 실험은 `experiments/stellarium`에 분리되어 있다.
