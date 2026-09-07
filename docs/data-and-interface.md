# 데이터·인터페이스 기획

앱 소스는 만들지 않는다. 아래 표는 향후 구현의 상태·단위·모듈 계약이다.

## 1. 지도 탐색과 확정 위치

| 모델 | 주요 필드 | 규칙 |
|---|---|---|
| MapViewport | 중심 위도·경도, 줌, 경계 | 지도 이동·검색으로 갱신, 관측 좌표와 별개 |
| SearchResult | provider, id, 표시 이름, 좌표, 선택적 경계 | 검색 결과는 지도 이동에만 사용 |
| SelectionState | 미선택 또는 ObserverLocation | 최종 지도 클릭/동등한 접근성 동작만 갱신 |
| ObserverLocation | selectionId, latitude, longitude, elevationM, label?, timezone? | WGS84 deg, 경도 [-180,180), 기본 고도 0m |
| NightEligibility | selectionId, evaluatedAtUtcMs, sunAltitudeDeg, allowed, reason | -18° 이하만 허용, 계산 오류는 차단 |

검색 결과를 고르면 선택 상태를 미선택으로 초기화하고 지도만 이동·확대한다. 기존 기상·밤 판정 응답도 무효화한다. 단순 pan/zoom은 확정 위치를 바꾸지 않는다.

클릭 좌표가 엔진과 기상의 공통 요청 기준이다. 제공자가 반환한 검색 중심·날씨 격자 중심은 원본 클릭 좌표를 대체하지 않는다. label·timezone은 최종 클릭 위치에 대해 확인한 값만 저장한다.

## 2. 시간·뷰 상태

| 모델 | 필드·규약 |
|---|---|
| LiveClock | 현재 UTC를 읽는 책임만 존재, 관측 시간을 별도로 저장·조작하지 않음 |
| ViewState | azimuthDeg [0,360), altitudeDeg [-90,90], fovDeg [20,120] |
| ConstellationLayers | linesVisible, labelsVisible |
| ViewerStatus | loading / ready / partial / blocked / error / suspended / disposed |

초기 시선은 북쪽 0°·고도 45°·FOV 70°다. PlaybackSpeed, 시뮬레이션 기준 시각, 사용자 paused 상태는 없다. 렌더링 suspended와 천문 시각 정지는 다르다. 복귀하면 현재 시각으로 다시 계산한다.

## 3. 순수 계산 계약

| 계약 | 결과 |
|---|---|
| normalizeMapCoordinate | 클릭 좌표 유한성·범위 검사, 경도 정규화 |
| getNightEligibility | 고정 버전의 기하 태양 고도, h <= -18° 판정 |
| readCurrentUtcMs | 현재 시스템 UTC, 테스트에서는 고정 입력 주입 가능 |
| utcMsToMjd | epoch ms / 86400000 + 40587 |
| degreesToRadians | degrees × π / 180 |
| formatObservationTime | 검증된 IANA timezone, 없으면 UTC |
| validateWeatherSnapshot | 좌표 키·시간·범위·단위·누락 검사 |

밤 판정 입력은 동일 UTC 스냅샷의 위도·경도다. 날씨의 is_day, 지역 시각의 ‘오후 8시’, 지도 픽셀의 색으로 판정하지 않는다.

## 4. 엔진 어댑터 계약

| 메서드 역할 | 책임 |
|---|---|
| mount | canvas와 엔진 준비 |
| setObserver | 확정 관측 위치 전달, deg → rad |
| syncCurrentTime | 호출 시 현재 UTC를 읽어 MJD로 전달 |
| setView / onViewChange | 시선·FOV 설정과 엔진 입력의 UI 반영 |
| setConstellationLayers | 선·이름 독립 설정 |
| resize | CSS 크기·DPR 반영 |
| suspend / resume | 렌더링 수명주기, 시간 제어 아님 |
| dispose | 앱 리소스 해제 |

이 이름들은 앱 계약이며 엔진에 동일 메서드가 있다고 주장하지 않는다. 엔진의 임의 시각 setter는 내부에 있을 수 있으나 제품 UI·URL에 노출하지 않는다. resume 전에 현재 UTC·밤 조건을 검사하고 blocked 상태이면 하늘을 표시하지 않는다.

## 5. 기상 데이터 계약 — 채택 시

| 필드 | 의미 |
|---|---|
| selectionId / locationKey | 요청 당시 클릭 위치와 선택 세대 |
| provider / attribution | 제공자와 출처 표기 |
| requestedLatitude / requestedLongitude | 관측 좌표 |
| gridLatitude / gridLongitude | 선택적 제공자 격자 좌표 |
| validAtUtcMs | 해당 기상값이 나타내는 시각 |
| fetchedAtUtcMs | 앱이 받아온 시각 |
| modelRunAtUtcMs | 제공되는 경우만 저장 |
| intervalSeconds | 강수 등 집계 시간의 길이 |
| cloudCoverPct | 0~100%, 누락은 null |
| weatherCode | 제공자 규약과 함께 해석 |
| precipitationMm | 단위·집계 간격과 함께 해석 |
| windSpeedMps / windDirectionDeg | 선택값, 지상 바람을 구름 이동으로 단정하지 않음 |

기상 상태는 loading / fresh / delayed / unavailable로 구분한다. 현재 시각보다 30분 넘게 오래되면 delayed, 60분 넘으면 unavailable을 초기 제안값으로 둔다. 좌표 불일치·잘못된 미래 시각·누락 필드는 검증 후 미반영 처리한다.

WeatherVisualState는 실제 기상값에서 만든 표시 상태이며 관측 데이터와 분리한다. 구름 형상·두께·이동은 시각화 매개변수다. 세부 정책은 [기상 반영 검토안](./weather-integration.md)을 따른다.

## 6. 수명주기

1. 최종 클릭 → 현재 UTC로 밤 판정
2. 허용 → 진입 버튼 → 현재 UTC로 재판정
3. 엔진·필수 데이터 로딩 → 첫 화면 표시 전에 다시 밤 판정
4. ready → 현재 시각 지속 반영, 매초 밤 재판정
5. 기준 초과·판정 실패 → blocked, 하늘 표시·렌더링 중단
6. 숨김 → suspended, 복귀 시 현재 UTC로 재판정
7. 다른 위치 선택·이탈 → 이전 비동기 응답 무효화·리소스 정리

별자리만 실패하면 partial로 하늘을 유지할 수 있지만 밤 조건은 동일하게 적용한다. 하늘 데이터가 실패한 경우 빈 화면을 정상 관측으로 표시하지 않는다.

## 7. URL·저장소 — 후속

MVP는 메모리 상태를 사용한다. 위치 없는 /sky 진입은 지도로 안내한다. 후속 공유는 지도 중심·선택 후보 위치와 시선만 담고 사용자가 지도에서 확인·선택한 뒤 현재 밤 판정을 거친다.

utc/date/time/speed 등의 입력으로 다른 시각의 하늘을 열 수 없다. 기존 형식의 시간 매개변수는 무시하고 현재 시각만 사용한다. 위치·시선도 유효성 검사를 통과해야 한다. 마지막 위치 저장을 도입해도 재방문 때 현재 밤 조건과 최종 선택을 다시 확인한다.

## 8. 자산 기록

개발 단계에서 엔진 커밋·JS/WASM 빌드, 별·sky culture·폰트·지도·검색·기상 데이터의 출처·버전·이용 조건을 기록한다. 한글화 추가 시 엔진 ID와 IAU 약자의 매핑을 검증한다. 현재 단계에서 실제 자산·패키지를 설치하지 않는다.

## 9. 지도 밝기 데이터

MapLightState는 evaluatedAtUtcMs, 태양 위치, nightThresholdDeg(-18 고정), nightTint, nightOpacity를 가진다. nightTint·nightOpacity는 전역 디자인 값이며 관측 가능 좌표별로 달라지지 않는다.

h > -18°의 낮·박명만 연속 밝기 함수로 표현하고 h <= -18°는 같은 상태색을 반환한다. 지도 음영의 투명도와 최종 진입 허용은 별도 값이다. 바탕지도 타일의 지형색과 조작 UI는 보존한다.
