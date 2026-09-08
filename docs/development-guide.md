# 개발 언어·진행 방식·커밋 규칙

기준일: 2026-09-08. 앞으로 개발할 때 따를 기준이다. 구현은 이 문서와 커밋별 구현 계획에 맞춰 진행하며 원격 푸시·배포는 별도 작업으로 다룬다.

## 1. 개발 언어와 도구

프론트엔드는 **TypeScript + React + Vite**, 백엔드는 사용자가 선택한 **Python + FastAPI**로 진행한다. 앞선 TypeScript 백엔드 통일안은 대체한다. 서버를 도입하는 시점은 외부 API의 비밀 키·공통 캐시·호출 제한이 필요한 때로 유지한다.

프론트엔드와 백엔드는 HTTP·JSON으로 연결하므로 같은 언어일 필요가 없다. TypeScript 타입과 Python 타입 힌트만으로 외부 데이터가 검증되는 것은 아니며 입력·응답의 런타임 검증을 별도로 둔다.

| 영역 | 언어·도구 | 역할·도입 시점 |
|---|---|---|
| 프론트엔드 | TypeScript + React + Vite | 처음부터 사용, 지도·화면·사용자 입력 |
| 스타일 | CSS + CSS Modules | 지도 패널·밤하늘 UI, 색상은 CSS 변수 |
| 상태 | React Context + reducer | 검색 후보·클릭 위치·화면 상태 |
| 하늘 연결 | TypeScript 어댑터 + Stellarium JS/WASM | 위치·현재 UTC·FOV·별자리 연결 |
| 백엔드 | Python + FastAPI + Uvicorn | 필요 시 기상/검색 중계·키·캐시·호출 제한 |
| API 데이터 모델 | Pydantic + OpenAPI | 요청·응답 검증, 언어와 독립적인 API 계약 |
| 데이터베이스 | 초기 도입 없음 | 계정·영속 저장 요구가 생기면 검토 |
| 웹 의존성 | npm + package-lock.json | 웹 의존성 재현 |
| API 의존성 | uv + pyproject.toml + uv.lock | Python 버전·가상환경·의존성 관리 |
| 웹 검증 | Vitest + React Testing Library + Playwright | 계산·UI·실제 브라우저 흐름 |
| API 검증 | pytest + FastAPI TestClient | 입력·응답·오류·외부 서비스 모의 검증 |
| 코드 품질 | 웹: TypeScript 검사·ESLint·Prettier / API: Ruff·Python 타입 검사 | 언어별 검사, 타입 검사 도구의 정확한 버전은 착수 시 고정 |

FastAPI는 Python 타입 힌트를 활용한 API 작성, 데이터 검증과 OpenAPI 문서화를 제공한다. uv는 Python 프로젝트의 환경·lockfile 관리, Ruff는 Python 린트·포맷에 사용한다. [FastAPI](https://fastapi.tiangolo.com/), [uv 프로젝트](https://docs.astral.sh/uv/guides/projects/), [Ruff](https://docs.astral.sh/ruff/), [API 테스트](https://fastapi.tiangolo.com/tutorial/testing/)

Node.js는 Vite와 웹 도구를 실행하는 용도로 사용한다. Python 서버를 선택해도 웹 개발 도구에는 필요하며 백엔드 런타임으로 사용하는 것은 아니다. Node.js LTS·Python·프레임워크의 지원 조합을 개발 착수 시 확인하고 버전을 고정한다. [Vite 문서](https://vite.dev/guide/), [Node.js 릴리스](https://nodejs.org/en/about/previous-releases)

Java + Spring Boot도 기술적으로 가능한 선택이다. Spring Boot는 독립 실행 가능한 Java 애플리케이션을 제공하며, 기존 Java 경험이나 Spring 기반 운영 환경이 있다면 선택할 이유가 있다. 이번에는 현재의 API 중계 중심 범위와 사용자 선택에 따라 Python + FastAPI로 확정했다. 두 서버를 동시에 구축하지 않는다. [Spring Boot 공식 문서](https://docs.spring.io/spring-boot/index.html)

지도는 Google Maps + Places를 우선 검토하고 기상은 Open-Meteo를 후보로 둔다. 공급자·비용·이용 조건은 미확정이다. Stellarium의 엔진 코드를 새로 작성하는 대신 웹 어댑터로 연결하며, 엔진 수정은 꼭 필요할 때 별도 범위로 다룬다.

## 2. 프론트엔드와 백엔드의 책임

| 프론트엔드 | 필요한 경우에만 백엔드 |
|---|---|
| 지도 검색 UI·이동·줌·최종 클릭 | 외부 API용 비밀 키 보관 |
| 태양 고도 -18° 이하 판정 | 공통 요청 캐시·전체 사용자 호출량 제한 |
| 현재 UTC·Stellarium 렌더링 | 기상/검색 API 중계와 응답 정규화 |
| 별자리·시선·줌·기상 표시 | 외부 서비스 실패·시간 초과 처리 |
| 현재 밤 종료·탭 복귀 UX | 향후 계정·즐겨찾기 저장 |

별 좌표를 서버에서 초당 전송하지 않는다. 백엔드 없이도 핵심 하늘 감상을 구성할 수 있지만 외부 서비스의 운영 조건에 따라 API가 필요해질 수 있다. 지도용 브라우저 키는 출처/API 제한을 적용하는 공개 클라이언트 키이고 서버용 비밀 키와 구분한다.

백엔드가 필요하면 요청·응답·오류·유효 시각 계약을 먼저 정하고 프론트엔드는 같은 계약의 fake 응답으로 화면을 연결할 수 있다. 이때 fake를 실제 기상처럼 운영 화면에 노출하지 않는다.

FastAPI의 요청·응답 모델에서 내보낸 OpenAPI 명세를 웹/API 계약의 기준으로 관리한다. 웹 타입을 생성할 경우 이 명세에서 생성하고, 수동 정의한다면 계약 테스트로 차이를 확인한다. 날짜는 UTC epoch ms, 각도는 도 단위 등 필드별 단위와 null 의미를 명시한다. 서로 다른 개발 출처는 제한된 CORS 설정 또는 개발 프록시로 연결하고 운영은 같은 출처의 /api 경로를 우선 검토한다.

## 3. 저장소 구조

```text
star/
├── docs/                      기획·설계·검증 기록
├── backend/                   Python + FastAPI
│   ├── app/
│   │   ├── main.py            앱 생성·수명주기·라우터 연결
│   │   ├── core/              설정·공유 자원 조립
│   │   └── weather/           기상 라우터·서비스·제공자·모델
│   ├── tests/                 API·서비스·제공자 검증
│   ├── openapi.json           API 도입 시 모델에서 내보낸 계약
│   ├── pyproject.toml
│   └── uv.lock
├── frontend/                  React + TypeScript + Vite
│   ├── src/
│   │   ├── app/               라우트·공통 상태·의존성 조립
│   │   ├── pages/             세계지도·밤하늘 페이지
│   │   ├── features/          지도·검색·밤 판정·하늘·기상 기능
│   │   └── shared/            공통 UI·시계·API 클라이언트
│   ├── public/                배포할 정적 자산, 엔진 자산은 공급 방식 확정 후
│   ├── experiments/
│   │   └── stellarium/       초기 엔진 검증, 제품 배포에서 제외
│   ├── tests/                 브라우저 E2E
│   ├── package.json
│   └── package-lock.json
└── README.md                  프로젝트 소개·실행 안내·문서 링크
```

사용자가 마련한 docs·backend·frontend의 세 최상위 폴더를 기준으로 한다. 현재 backend·frontend는 빈 폴더이며 위의 내부 구조는 향후 배치안이다. 내부 파일은 해당 기능에 착수할 때 만든다. 백엔드 폴더가 있다는 이유로 서버 도입을 앞당기지는 않는다.

웹은 frontend에서 npm, API는 backend에서 uv로 의존성과 실행·빌드를 따로 관리하되 루트의 Git 저장소 하나에서 버전 관리한다. README·.gitignore 같은 공통 파일은 루트에 둘 수 있으며 향후 CI를 위한 .github 같은 도구 폴더도 필요할 때 추가한다. Git은 빈 폴더를 추적하지 않으므로 현재 로컬의 빈 폴더는 그대로 커밋되지 않는다. 최초 환경 구성 파일을 넣는 시점에 함께 추적한다.

프론트엔드는 기능별로 관련 UI·Hook·계약·어댑터와 단위 테스트를 가까이 둔다. 예를 들어 features/sky-viewer에 SkyEngine 계약과 StellariumAdapter를, features/night-eligibility에 밤 판정 순수 함수를 둔다. shared에는 실제로 여러 기능이 공유하는 항목만 둔다. 백엔드는 app/weather 안에서 router.py·service.py·provider.py·schemas.py와 providers/open_meteo.py처럼 책임을 나누며, 검색 중계가 필요해지면 app/search를 추가한다. 작은 기능은 처음부터 여러 빈 파일로 나누지 않는다.

API 계약의 원본은 백엔드 Pydantic 모델이며 backend/openapi.json은 그 모델에서 내보낸 명세다. 프론트엔드 타입을 생성하면 frontend/src/shared/api/generated에 두고 생성 결과를 직접 수정하지 않는다. 두 언어의 코드를 공통 폴더에서 억지로 공유하지 않고 HTTP·JSON 계약으로 연결한다.

엔진 검증용 화면은 frontend/experiments/stellarium에 두고 제품 빌드 입력·public·공개 라우트에 포함하지 않는다. 제품의 낮 차단이나 시간 규칙을 우회하는 공개 경로로 남기지 않는다. 내부 책임 기준은 [객체지향 설계](./object-oriented-design.md)를 따른다.

## 4. 개발 순서

1. **작업 환경과 엔진 최소 검증**: 엔진·필수 데이터·좌표·현재 시각·줌·별자리의 공급 가능성 확인
2. **앱 기반과 밤 판정**: 공통 좌표·시계·-18° 경계·라우트 정의
3. **메인 세계지도**: 지도 탐색·검색·클릭 확정·선택 카드·낮/박명 음영·동일 밤 색
4. **밤하늘 상세 페이지**: 검증한 엔진을 연결하고 시선·줌·별자리·밤 종료·복귀 처리
5. **기상·필요 시 백엔드**: 데이터 안내부터, 구름 합성은 검증 후
6. **품질·출시 준비**: 실제 기기·성능·오류·자산·배포 설정

엔진의 최소 검증을 먼저 끝내고, 정식 화면 개발은 메인 지도에서 상세 페이지 순서로 진행한다. 구체적인 커밋 순서는 [커밋별 구현 계획](./implementation-plan.md)을 따른다.

## 5. 커밋 단위 진행 방법

한 커밋은 ‘하나의 목적이며 검토·되돌리기 가능한 완료된 변경’으로 잡는다. 파일 하나당 커밋하거나, 프론트/백엔드라는 이유만으로 동작에 필요한 변경을 억지로 분리하지 않는다.

1. 해당 커밋의 목적·요구사항·완료 기준을 확인한다.
2. 관련 변경과 필요한 검증을 함께 수행한다.
3. 변경 범위를 검토하고 해당 영역의 타입·린트·관련 테스트·필요한 빌드를 확인한다. API 변경은 Ruff·pytest와 정한 Python 타입 검사를 포함한다.
4. 동작 변경의 테스트·설정·관련 문서는 가능하면 같은 커밋에 포함한다.
5. 관련 파일만 스테이징하고 한글 Conventional Commit 메시지로 커밋한다.
6. 실제 커밋 해시·제목·검증 결과·남은 제한을 알리고, 정한 개발 범위의 다음 단위로 진행한다.

테스트만 나중에 몰아서 작성하지 않는다. 밤 경계·좌표 변환·비동기 응답 순서처럼 오류 영향이 큰 부분은 기능 커밋에서 검증한다. 단순 문구·스타일 변경에는 적절한 화면 확인을 사용한다.

계획표의 번호는 작업 식별자이지 반드시 지켜야 할 커밋 개수가 아니다. 구현 중 변경이 커지면 독립 동작 단위로 나누고 실제 범위에 맞게 제목을 바꾼다. 실패를 숨기거나 검증하지 않은 항목을 ‘통과’로 적지 않는다.

## 6. 커밋 메시지 컨벤션

Conventional Commits 1.0.0 형식을 사용한다. **타입·scope는 영어 소문자, 설명·본문은 한글**로 작성한다. scope 사용, 제목 길이, 한글 문체는 이 프로젝트의 추가 규칙이며 공식 스펙이 강제하는 사항은 아니다. [Conventional Commits 한국어 명세](https://www.conventionalcommits.org/ko/v1.0.0/)

```text
타입(scope): 한글 변경 요약

변경 이유와 결과
필요한 검증 내용과 남은 제한

Refs: #실제이슈번호
```

본문과 꼬리말은 필요할 때만 쓰고 실제 이슈가 없으면 Refs를 생략한다. 제목은 72자 이내를 목표로 하며 ‘추가’, ‘수정’, ‘분리’, ‘적용’처럼 구체적인 결과로 끝낸다. ‘작업 중’, ‘수정함’, ‘기능 개발’처럼 내용을 알 수 없는 제목은 피한다.

| 타입 | 용도 | 예시 |
|---|---|---|
| feat | 사용자 기능·도메인 동작 추가 | `feat(map): 세계지도 확대와 이동 기능 추가` |
| fix | 기존 동작의 오류 수정 | `fix(location): 지도 스와이프 종료 시 좌표가 선택되는 문제 수정` |
| refactor | 외부 동작을 유지한 내부 구조 변경 | `refactor(sky): 엔진 수명주기 관리를 어댑터로 분리` |
| perf | 측정 근거가 있는 성능 개선 | `perf(map): 지도 음영 계산의 중복 실행 제거` |
| test | 테스트 자체 추가·개선 | `test(e2e): 밤 위치 선택부터 하늘 진입까지 검증` |
| docs | 문서 수정 | `docs(plan): 개발 순서와 커밋 규칙 정리` |
| build | 빌드·산출물·의존성 구성 | `build(stellarium): 엔진 버전과 자산 경로 고정` |
| ci | 자동 검증·CI 구성 | `ci(repo): 타입 검사와 테스트 자동화 추가` |
| chore | 환경·개발 도구·유지 작업 | `chore(web): React와 TypeScript 개발 환경 구성` |
| style | 의미 없는 코드 포맷 변경 | `style(web): 코드 들여쓰기와 공백 정리` |
| revert | 이전 변경 되돌림 | `revert(map): 지도 음영 합성 방식 변경 되돌림` |

화면 색상·레이아웃을 바꾸는 일은 style 타입으로 일괄 처리하지 않는다. 새 UI는 feat, 잘못된 UI 수정은 fix, 코드 공백·포맷만 바꾸면 style이다. spike는 별도 표준 타입으로 두지 않고 초기 실험은 chore(spike), 결과 기록은 docs(stellarium)으로 쓴다.

scope 예: repo, web, api, map, search, location, night, sky, stellarium, weather, contracts, e2e, licenses, plan, tooling.

## 7. 한글 본문 예시

아래는 앞으로 해당 변경과 검증을 마친 경우에 사용할 메시지 예시다. 현재 구현·검증 완료 내역이 아니다.

```text
feat(night): 태양 고도 기준의 밤하늘 진입 조건 추가

천문학적으로 어두운 위치에서만 하늘을 볼 수 있도록
태양 중심의 기하 고도 -18도 이하를 허용한다.

- 클릭 좌표와 현재 UTC로 관측 가능 여부를 계산
- 낮과 박명은 차단하고 계산 오류도 진입 불가로 처리
- -18도 경계와 각도 단위 변환 검증
```

```text
feat(map): 관측 가능 영역에 동일한 밤 색상 적용

낮과 박명에는 부드러운 밝기 변화를 적용하고
태양 고도 -18도 이하 영역은 같은 색상과 투명도로 표시한다.

- 밤에서도 지도 지명과 도로의 가독성 유지
- 지도를 이동하거나 확대해도 음영의 지리 위치 유지
```

호환성을 깨는 계약 변경은 `feat(api)!: 기상 응답의 시각 필드 구조 변경`처럼 !를 붙이거나 `BREAKING CHANGE:` 꼬리말로 설명한다. 일반 기능 추가·기획 변경에 무조건 !를 붙이지 않는다.

## 8. 브랜치·완료 보고

main은 정상 빌드 가능한 상태로 유지하고, feat/world-map·feat/sky-viewer처럼 기능 브랜치에서 여러 개의 작은 커밋을 만들도록 제안한다. 공유 이력의 강제 재작성은 기본 작업에 포함하지 않는다. 로컬 커밋과 원격 푸시·PR 병합·배포는 별개의 작업이다.

개발 시 보고 형태:

```text
완료: 실제 커밋 해시
커밋: feat(location): 지도 클릭 좌표 확정과 선택 카드 추가
변경: 최종 지도 클릭만 관측 좌표를 확정하도록 연결
검증: 실제 수행한 검사와 결과
남은 항목: 검증하지 못한 부분이 있으면 명시
다음: 관측 가능 영역의 지도 음영
```

Python API의 시작 메시지는 `chore(api): Python과 FastAPI 개발 환경 구성`, 외부 연동 메시지는 `feat(api): 관측 위치의 기상 정보 조회 추가`처럼 작성한다.

현재 문서 변경을 나중에 커밋할 때의 추천 제목은 `docs(plan): 개발 언어와 커밋 단위 진행 계획 정리`다. 이번 문서 정리에서 실제 커밋을 생성한 것은 아니다.

## 9. 객체지향 적용 기준

외부 서비스·엔진·수명주기가 있는 객체는 역할별 계약으로 분리하고 합성과 의존성 주입을 사용한다. React는 함수 컴포넌트·Hook, 밤 판정·각도 변환은 순수 함수로 유지한다. 백엔드는 Router → Service → Provider 계약으로 나누고 구체 공급자는 조립 지점에서 연결한다.

Python은 Protocol과 Pydantic의 책임을 구분하고, 프론트엔드는 TypeScript interface로 SDK 의존성을 감춘다. 공급자별 코드가 UI·정책에 퍼지지 않게 하되 모든 함수에 클래스·상속·추상 계층을 만들지는 않는다. 초기 구현에 필요한 구조와 검증을 같은 기능 커밋에 포함한다. [상세 설계와 예시](./object-oriented-design.md)
