# 데이터·인터페이스 기획

아래 표는 구현의 상태·단위·모듈 계약이다.

## 1. 지도 탐색과 확정 위치

| 모델             | 주요 필드                                                                    | 규칙                                                |
| ---------------- | ---------------------------------------------------------------------------- | --------------------------------------------------- |
| MapViewport      | 중심 위도·경도, 줌, 경계                                                     | 지도 이동·검색으로 갱신, 관측 좌표와 별개           |
| SearchResult     | provider, id, 표시 이름, 좌표, 선택적 경계                                   | 검색 결과는 지도 이동에만 사용                      |
| SelectionState   | 미선택 또는 ObserverLocation                                                 | 최종 지도 클릭/동등한 접근성 동작만 갱신            |
| ObserverLocation | selectionId, latitude, longitude, elevationM, label?, timezone?              | WGS84 deg, 경도 [-180,180), 기본 고도 0m            |
| NightEligibility | selectionId, evaluatedAtUtcMs, sunAltitudeDeg, thresholdDeg, allowed, reason | 공개 설정의 기준 이하만 허용, 계산·설정 오류는 차단 |

검색 결과를 고르면 선택 상태를 미선택으로 초기화하고 지도만 이동·확대한다. 기존 기상·밤 판정 응답도 무효화한다. 단순 pan/zoom은 확정 위치를 바꾸지 않는다.

클릭 좌표가 엔진과 기상의 공통 요청 기준이다. 제공자가 반환한 검색 중심·날씨 격자 중심은 원본 클릭 좌표를 대체하지 않는다. label·timezone은 최종 클릭 위치에 대해 확인한 값만 저장한다.

## 2. 시간·뷰 상태

| 모델                | 필드·규약                                                          |
| ------------------- | ------------------------------------------------------------------ |
| LiveClock           | 현재 UTC를 읽는 책임만 존재, 관측 시간을 별도로 저장·조작하지 않음 |
| ViewState           | azimuthDeg [0,360), altitudeDeg [-90,90], fovDeg [20,120]          |
| ConstellationLayers | linesVisible, labelsVisible                                        |
| ViewerStatus        | loading / ready / partial / blocked / error / suspended / disposed |

초기 시선은 북쪽 0°·고도 45°·FOV 70°다. PlaybackSpeed, 시뮬레이션 기준 시각, 사용자 paused 상태는 없다. 렌더링 suspended와 천문 시각 정지는 다르다. 복귀하면 현재 시각으로 다시 계산한다.

## 3. 순수 계산 계약

| 계약                    | 결과                                                                        |
| ----------------------- | --------------------------------------------------------------------------- |
| normalizeMapCoordinate  | 클릭 좌표 유한성·범위 검사, 경도 정규화                                     |
| getNightEligibility     | 고정 버전의 기하 태양 고도와 주입된 thresholdDeg로 `h <= thresholdDeg` 판정 |
| readCurrentUtcMs        | 현재 시스템 UTC, 테스트에서는 고정 입력 주입 가능                           |
| utcMsToMjd              | epoch ms / 86400000 + 40587                                                 |
| degreesToRadians        | degrees × π / 180                                                           |
| formatObservationTime   | 검증된 IANA timezone, 없으면 UTC                                            |
| validateWeatherSnapshot | 좌표 키·시간·범위·단위·누락 검사                                            |

밤 판정 입력은 동일 UTC 스냅샷의 위도·경도다. 날씨의 is_day, 지역 시각의 ‘오후 8시’, 지도 픽셀의 색으로 판정하지 않는다.

## 4. 엔진 어댑터 계약

| 메서드 역할            | 책임                                |
| ---------------------- | ----------------------------------- |
| mount                  | canvas와 엔진 준비                  |
| setObserver            | 확정 관측 위치 전달, deg → rad      |
| syncCurrentTime        | 호출 시 현재 UTC를 읽어 MJD로 전달  |
| setView / onViewChange | 시선·FOV 설정과 엔진 입력의 UI 반영 |
| setConstellationLayers | 선·이름 독립 설정                   |
| resize                 | CSS 크기·DPR 반영                   |
| suspend / resume       | 렌더링 수명주기, 시간 제어 아님     |
| dispose                | 앱 리소스 해제                      |

이 이름들은 앱 계약이며 엔진에 동일 메서드가 있다고 주장하지 않는다. 엔진의 임의 시각 setter는 내부에 있을 수 있으나 제품 UI·URL에 노출하지 않는다. resume 전에 현재 UTC·밤 조건을 검사하고 blocked 상태이면 하늘을 표시하지 않는다.

## 5. 기상 데이터 계약 — 채택 시

| 필드                                   | 의미                                            |
| -------------------------------------- | ----------------------------------------------- |
| selectionId / locationKey              | 요청 당시 클릭 위치와 선택 세대                 |
| provider / attribution                 | 제공자와 출처 표기                              |
| requestedLatitude / requestedLongitude | 관측 좌표                                       |
| gridLatitude / gridLongitude           | 선택적 제공자 격자 좌표                         |
| validAtUtcMs                           | 해당 기상값이 나타내는 시각                     |
| fetchedAtUtcMs                         | 앱이 받아온 시각                                |
| modelRunAtUtcMs                        | 제공되는 경우만 저장                            |
| intervalSeconds                        | 강수 등 집계 시간의 길이                        |
| cloudCoverPct                          | 0~100%, 누락은 null                             |
| weatherCode                            | 제공자 규약과 함께 해석                         |
| precipitationMm                        | 단위·집계 간격과 함께 해석                      |
| windSpeedMps / windDirectionDeg        | 선택값, 지상 바람을 구름 이동으로 단정하지 않음 |

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

## 7. URL·브라우저 저장소

관측 위치와 화면 상태는 메모리를 사용한다. 닉네임과 클라이언트 세션 ID만 탭 단위 `sessionStorage`에 보관해 새로고침에 유지하고 탭 종료 시 삭제한다. 위치 없는 /sky 진입은 지도로 안내한다. 후속 공유는 지도 중심·선택 후보 위치와 시선만 담고 사용자가 지도에서 확인·선택한 뒤 현재 밤 판정을 거친다.

utc/date/time/speed 등의 입력으로 다른 시각의 하늘을 열 수 없다. 기존 형식의 시간 매개변수는 무시하고 현재 시각만 사용한다. 위치·시선도 유효성 검사를 통과해야 한다. 마지막 위치 저장을 도입해도 재방문 때 현재 밤 조건과 최종 선택을 다시 확인한다.

## 8. 자산 기록

개발 단계에서 엔진 커밋·JS/WASM 빌드, 별·sky culture·폰트·지도·검색·기상 데이터의 출처·버전·이용 조건을 기록한다. 한글화 추가 시 엔진 ID와 IAU 약자의 매핑을 검증한다. 현재 단계에서 실제 자산·패키지를 설치하지 않는다.

## 9. 지도 밝기 데이터

MapLightState는 evaluatedAtUtcMs, 태양 위치, nightThresholdDeg, nightTint, nightOpacity를 가진다. nightThresholdDeg는 공개 설정 API가 반환한 값이며 기본값은 -18이다. nightTint·nightOpacity는 전역 디자인 값이며 관측 가능 좌표별로 달라지지 않는다.

`h > nightThresholdDeg`는 연속 밝기 함수로 표현하고 기준 이하는 같은 상태색을 반환한다. 지도 음영의 투명도와 최종 진입 허용은 별도 값이다. 바탕지도 타일의 지형색과 조작 UI는 보존한다.

## 10. Python API와 웹 계약

백엔드 도입 시 Python + FastAPI의 Pydantic 요청·응답 모델에서 OpenAPI를 내보내 계약을 관리한다. 프론트엔드 TypeScript 타입은 이 명세와 일치시킨다. 입력 좌표·단위·null·오류·기상 유효 시각을 양쪽에서 검증하며 Python 모델 파일을 웹에서 직접 공유하지 않는다.

초기 API 범위는 공개 설정, 닉네임 방문 세션, 실시간 presence다. 이후 필요한 기상/검색 중계·키·캐시·요청 제한을 추가한다. 현재 시각의 별 좌표를 서버에서 매초 계산·전송하지 않으며 공개 API에는 사용자가 천문 시간을 조작할 필드를 제공하지 않는다.

공개 설정 모델 `PublicAppConfig`는 `nightAltitudeThresholdDeg`와 `presenceCellSizeDeg`를 가진다. 서버 환경 변수 `NIGHT_ALTITUDE_THRESHOLD_DEG`와 `PRESENCE_CELL_SIZE_DEG`의 기본값은 각각 -18과 0.25다. 숫자·범위를 시작 시 검증하고 프론트엔드는 같은 정책값을 별도로 정의하지 않는다.

## 11. 방문 세션과 presence 계약

| 모델           | 주요 필드                                                          | 규칙                                       |
| -------------- | ------------------------------------------------------------------ | ------------------------------------------ |
| VisitorSession | participantId, displayName, expiresAtUtcMs                         | 서버 발급 임시 ID, 계정이나 본인 인증 아님 |
| PresenceUpdate | participantId, cellId, displayLatitude, displayLongitude, status   | `watching`만 공개, 원본 클릭 좌표 없음     |
| PresenceMember | participantId, displayName                                         | 공개 닉네임, HTML로 해석하지 않음          |
| PresenceCell   | cellId, displayLatitude, displayLongitude, members, updatedAtUtcMs | 같은 셀을 한 지도 핀으로 집계              |
| PresenceStatus | connecting / live / reconnecting / unavailable                     | unavailable이어도 지도·하늘 핵심 흐름 유지 |

닉네임은 정규화·길이·허용 문자를 웹과 API에서 모두 검사한다. 중복 닉네임을 허용하므로 내부 participantId와 displayName을 구분한다. 클라이언트는 정확한 ObserverLocation을 기본 0.25° 셀 중심으로 양자화한 뒤 전송하고 서버 응답은 셀 중심만 반환한다.

WebSocket 연결은 최초 PresenceCell 스냅샷과 이후 upsert/remove 이벤트를 전달한다. heartbeat는 20초, 서버 TTL은 60초를 초기값으로 둔다. 서버 UTC가 last-seen과 만료의 권위이며 클라이언트 시각을 신뢰하지 않는다. 메시지 스키마·크기·빈도와 위치 범위를 검증한다.

## 12. 역할 계약과 데이터 모델 구분

MapViewport는 지도 중심·줌 데이터이고 MapController는 지도 조작·선택 이벤트의 역할 계약이다. SearchResult는 데이터, PlaceSearchProvider는 검색 동작 계약이다. 기존 SkyEngine 계약은 StellariumAdapter가 구현한다.

백엔드 PresenceService는 Clock과 PresenceStore 계약을 사용하고 WebSocket이나 FastAPI 타입에 직접 의존하지 않는다. 초기 InMemoryPresenceStore는 TTL 상태만 가지며 서버 재시작 시 모두 사라진다. WeatherProvider는 정규화된 WeatherSnapshot과 공급자와 독립적인 오류를 반환한다. WeatherService도 제공자·시계 등 필요한 의존성을 인자로 받는다. 타입 계약과 런타임 입력 검증을 구분한다.

정확한 관측 위치는 웹 상태에만 권위 있게 보관한다. 공유 서버는 활성 관측자의 근사 격자 위치만 TTL 동안 보관하고 계정·관측 이력을 영구 저장하지 않는다. 불필요하게 데이터 모델과 동일한 클래스를 여러 계층에 복제하지 않는다. [객체지향 설계](./object-oriented-design.md), [닉네임·관측자 핀](./presence-and-chat.md)
