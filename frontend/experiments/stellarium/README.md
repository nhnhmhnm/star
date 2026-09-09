# Stellarium Engine Experiment

C05에서 사용하는 Stellarium Web Engine 검증용 공간입니다. 제품 라우트와 제품 빌드 입력에는 포함하지 않습니다.

## 목적

고정 커밋의 JS/WASM 엔진이 브라우저에서 실제로 초기화되고, 다음 항목을 제어할 수 있는지 확인합니다.

- 현재 UTC를 Modified Julian Date로 변환해 관측자 시간에 반영
- 위도와 경도를 관측자 위치에 반영
- FOV 줌 변경
- 대기 효과 표시 전환
- 별자리 선과 이름 표시 전환
- 엔진이 제공하는 캔버스 드래그, 휠, 터치 입력 연결

## 실행

먼저 `public/stellarium-engine`, `public/stellarium-skydata`, `public/stellarium-fonts`에 C05용 엔진 산출물과 테스트 데이터가 준비되어 있어야 합니다. 해당 자산은 용량과 라이선스 검토 전 단계이므로 Git에 커밋하지 않습니다.

```bash
cd frontend
npm run dev:stellarium
```

PowerShell 실행 정책이나 nvm 링크 때문에 Node 16이 잡히면 Vite 8과 ESLint 10이 실패합니다. 이 저장소는 Node 22.14 이상을 기준으로 하므로, 로컬에서는 Node 22.14.0 이상으로 전환한 뒤 실행합니다.

## C05 확인 결과

- Docker 기반 Emscripten/SCons 환경에서 고정 커밋 `e7201246bdf7289c50a3ec59e98f69f0f9383b05`의 `make js-es6` 빌드가 성공했습니다.
- 생성된 `stellarium-web-engine.js`와 `stellarium-web-engine.wasm`을 실험용 public 경로에서 제공했습니다.
- 고정 커밋의 폰트 자산은 Roboto가 아니라 `data/font/NotoSans-Regular.ttf`, `data/font/NotoSans-Bold.ttf`였습니다. 실험 manifest와 코드도 NotoSans 경로로 맞췄습니다.
- Vite dev 서버에서 `/stellarium-engine/stellarium-web-engine.wasm`은 `application/wasm`으로 응답했습니다.
- headless Chrome 스크린샷에서 엔진 상태가 `Rendering`으로 바뀌고, 현재 UTC와 서울 좌표가 표시되며, 대기 효과와 별자리 선/이름이 렌더링되는 것을 확인했습니다.

현재 실험 화면은 밤 진입 정책을 적용하지 않습니다. 낮 위치에서는 엔진의 대기 효과 때문에 하늘이 밝게 보일 수 있습니다. 실제 제품에서는 C07 이후 공개 설정에서 받은 밤 고도 기준으로 진입을 판정하며 기본값은 -18°입니다. 통과 항목과 남은 제약은 [C06 검증 기록](../../../docs/stellarium-validation.md)을 참고합니다.
