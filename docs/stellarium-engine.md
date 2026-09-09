# Stellarium Web Engine 공급 기준

기준일: 2026-09-09. C04의 공급 결정과 C05의 엔진 실험 기준이다. 상세 실행 결과와 남은 제약은 [C06 검증 기록](./stellarium-validation.md)에 정리한다.

## 공식 근거

Stellarium Web Engine은 웹사이트에 임베드할 수 있는 WebGL 기반 JavaScript 천문 렌더러다. 공식 README는 대기 시뮬레이션, Gaia 별 데이터 접근, 별자리, 하늘 레이어와 landscape 기능을 제공한다고 설명한다. JavaScript 버전은 Emscripten과 SCons를 준비한 뒤 `make js`로 `stellarium-web-engine.js`와 `stellarium-web-engine.wasm`을 만든다.

공식 simple-html 예제는 브라우저에서 `stellarium-web-engine.js`를 로드하고, `StelWebEngine`에 `wasmFile`과 `canvas`를 넘긴다. 준비가 끝난 뒤 별, sky culture, DSO, landscape, Milky Way, 태양·달 데이터 소스를 추가하고 폰트를 등록한다. C05에서 고정 커밋을 빌드한 결과, 해당 커밋의 로컬 폰트 자산은 Roboto가 아니라 NotoSans였다.

- 공식 저장소: https://github.com/Stellarium/stellarium-web-engine
- 공식 README: https://raw.githubusercontent.com/Stellarium/stellarium-web-engine/master/README.md
- simple-html 예제: https://raw.githubusercontent.com/Stellarium/stellarium-web-engine/master/apps/simple-html/stellarium-web-engine.html
- 라이선스: https://raw.githubusercontent.com/Stellarium/stellarium-web-engine/master/LICENSE-AGPL-3.0.txt

## 고정 기준

첫 실험은 공식 저장소의 다음 커밋을 기준으로 한다.

```text
repository: https://github.com/Stellarium/stellarium-web-engine.git
commit: e7201246bdf7289c50a3ec59e98f69f0f9383b05
```

엔진은 npm 패키지로 직접 설치하지 않는다. 공식 저장소를 지정 커밋으로 받아 JS/WASM 산출물을 만들고, React 앱은 이를 어댑터에서 로드한다. 제품 코드가 Stellarium 전역 객체를 직접 만지지 않도록 C14에서 `SkyEngine` 계약과 `StellariumAdapter`로 감싼다.

## 실험 자산 경로

C05 실험은 `frontend/experiments/stellarium` 아래에서만 실행한다. 실험용 HTML이나 React 진입점은 제품 라우트와 제품 빌드 입력에 포함하지 않는다.

브라우저에서 볼 경로는 다음처럼 고정한다.

```text
/stellarium-engine/stellarium-web-engine.js
/stellarium-engine/stellarium-web-engine.wasm
/stellarium-skydata/stars
/stellarium-skydata/skycultures/western
/stellarium-skydata/dso
/stellarium-skydata/surveys/milkyway
/stellarium-skydata/surveys/sso/moon
/stellarium-skydata/surveys/sso/sun
/stellarium-fonts/NotoSans-Regular.ttf
/stellarium-fonts/NotoSans-Bold.ttf
```

태양·달·대기와 별자리 선·이름을 확인해야 하므로 stars, skycultures/western, sun, moon, font 파일은 C05의 필수 자산이다. DSO, Milky Way, landscape는 첫 실험에서 누락되어도 핵심 진입 검증 실패로 보지 않지만, 누락 여부를 C06에 기록한다.

## 재현 절차

1. `frontend/experiments/stellarium/vendor/stellarium-web-engine`에 공식 저장소를 클론한다.
2. `e7201246bdf7289c50a3ec59e98f69f0f9383b05`로 checkout한다.
3. 공식 README에 따라 Emscripten과 SCons 환경에서 `make js`를 실행한다. Windows 로컬에서 막히면 WSL 또는 Linux 환경으로 빌드한다.
4. 생성된 `stellarium-web-engine.js`와 `stellarium-web-engine.wasm`을 실험용 public 경로의 `/stellarium-engine/`에 둔다.
5. 필요한 skydata와 font를 `/stellarium-skydata/`, `/stellarium-fonts/` 아래에 둔다.
6. C05에서 캔버스 첫 프레임, 현재 UTC, 좌표 설정, FOV 변경, 대기 표시, 별자리 선과 이름 토글을 확인한다.

빌드 산출물과 skydata는 크기와 라이선스 검토가 끝나기 전까지 Git에 넣지 않는다. C21에서 실제 사용하는 엔진·데이터·폰트의 고지와 소스 제공 방식을 확정한다.

## C05 실험 결과

Docker 기반 Emscripten/SCons 환경에서 `make js-es6` 빌드를 완료했고, 실험용 public 경로로 JS/WASM, 테스트 skydata, NotoSans 폰트를 복사했다. Vite dev 서버는 `stellarium-web-engine.wasm`을 `application/wasm`으로 제공했다.

실험 페이지에서는 현재 UTC를 `date2MJD`로 변환해 `stel.observer.utc`에 1초마다 반영한다. 위도와 경도는 `stel.D2R`로 라디안 변환 후 `stel.observer.latitude`, `stel.observer.longitude`에 넣는다. FOV는 `stel.zoomTo`, 대기는 `stel.core.atmosphere.visible`, 별자리 선과 이름은 `stel.core.constellations.lines_visible`, `stel.core.constellations.labels_visible`로 제어되는 것을 확인했다.

headless Chrome 스크린샷에서 엔진 상태가 `Rendering`으로 전환되고, 현재 UTC와 서울 좌표, 대기 효과, 별자리 선과 이름이 표시됐다. 이 실험 화면은 제품의 밤 진입 정책을 적용하지 않으므로 낮 위치에서는 하늘이 밝게 보일 수 있다. 실제 제품에서는 C07 이후 환경 설정에서 받은 밤 고도 기준으로 낮 위치의 하늘 진입을 막으며 기본값은 -18°다.

C05의 핵심 연결은 통과했지만 모바일 입력·실기기 성능·반복 초기화 수명주기·운영 자산 공급은 아직 검증하지 않았다. 빌드 호환 패치와 Vite의 public module 제한도 제품 빌드에서 해결해야 한다. 통과·부분 통과·미검증 항목은 [검증 결과와 제약](./stellarium-validation.md)을 기준으로 판단한다.
