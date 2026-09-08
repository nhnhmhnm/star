# Real Time Sky Frontend

React, TypeScript, Vite 기반의 웹 앱이다. 제품 요구사항과 구현 순서는 루트의 `docs` 문서를 따른다.

## 실행

Node.js는 루트의 `.nvmrc`와 `.node-version`에 적힌 22.14.0을 사용한다. Windows PowerShell에서 `npm` 실행 정책 오류가 나면 `npm.cmd`를 사용한다.

```bash
npm install
npm run dev
npm run build
```

지도, 밤 판정, Stellarium Web Engine 연결은 커밋별 구현 계획에 맞춰 이후 기능 단위로 추가한다.
