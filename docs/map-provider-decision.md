# 지도·검색 제공자 선택 근거

검토일: 2026-09-09. 이 문서는 C09의 결과로, 다음 지도 구현 단계에서 어떤 SDK와 검색 API를 우선 연결할지 정한다. 실제 계정 생성, 결제 등록, 키 발급은 이 커밋에서 수행하지 않는다. 사용자는 이 프로젝트를 개인 프로젝트로 로컬호스트에서 실행하고, 소수 사용자만 참여하며, 돈을 쓰지 않기로 결정했다.

## 1. 결론

MVP의 우선 구현 후보는 **MapLibre GL JS + 무료 개발용 지도 스타일/타일**이다. 검색은 처음부터 유료 Places류 자동완성을 붙이지 않고, 무료로 유지할 수 있는 방식부터 단계적으로 붙인다.

이 프로젝트의 지도는 일반적인 Google Maps 같은 줌·드래그·스와이프·검색 이동을 제공해야 하지만, 제품 차별점은 지도 위에 현재 태양 고도 기반 밝기장, 동일한 밤 색상 영역, 관측자 핀, 선택 마커를 계속 갱신하는 데 있다. MapLibre GL JS는 오픈소스 렌더링 라이브러리라 앱 코드가 특정 과금형 지도 SDK에 묶이지 않고, 지도 위에 커스텀 데이터를 올리는 구조를 만들기 좋다. 검색은 처음에는 작은 무료 데이터나 로컬 데이터 기반으로 시작하고, 결과는 지도 이동·확대에만 사용한다.

Mapbox GL JS + Mapbox Geocoding API는 **무료 쿼터형 대안**으로 남긴다. 무료 구간이 있지만 계정·토큰·한도·초과 과금 가능성을 관리해야 하므로, “돈을 쓰지 않는 개인 프로젝트”의 기본값으로 두지 않는다.

Google Maps JavaScript API + Places는 **검색 품질 우선 대안**으로 남긴다. 특히 한국어 장소·상호 검색 품질이나 사용자가 기대하는 지도 감각이 MapLibre 기반 무료 지도보다 중요해지는 경우 재검토한다. 단, 결제 활성화가 필요하고 Places 결과를 표시하는 지도 제한과 SKU별 과금 구조가 있어 현재 프로젝트 기본값으로는 채택하지 않는다.

네이버 지도와 카카오맵은 한국 지역 품질이 강한 대안이지만, 이 서비스는 세계지도를 중심으로 낮·밤 경계를 보여주고 전 세계 위치를 클릭해야 한다. 따라서 한국 전용 검색 보강 후보로 남기고, 첫 세계지도 구현의 기본 공급자로 삼지 않는다.

OpenStreetMap 공개 타일 서버와 공개 Nominatim은 운영 기본 공급자로 쓰지 않는다. 자체 타일 서버나 상용 OSM 기반 공급자를 선택한다면 별도 단계에서 검토한다.

## 2. 무료 사용 가능성

로컬호스트 개인 프로젝트와 소수 사용자 기준에서는 0원 개발이 가능하다. 다만 외부 무료 공용 서버를 많이 쓰거나 공개 운영처럼 트래픽이 커지면 제한에 걸릴 수 있다.

| 선택지                       | 무료 범위                                                    | 주의점                                                                               | 추천 용도                    |
| ---------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------ | ---------------------------- |
| MapLibre GL JS               | 지도 렌더링 라이브러리 자체는 오픈소스                       | 타일과 검색 데이터 공급자는 별도로 필요                                              | MVP 우선 후보                |
| Mapbox 무료 구간             | Web map load와 Temporary Geocoding에 월 무료 구간 제공       | 계정·토큰·도메인 제한 필요, 무료 구간 초과 시 과금 가능                              | 현재 기본값 제외             |
| MapTiler Cloud Free          | 비상업·개발 용도로 제한된 무료 세션·요청 제공                | 무료 플랜은 상업 사용 불가, 한도 소진 시 중단                                        | 로컬 개발·비상업 데모 후보   |
| Kakao Map 무료 쿼터          | 첫 활성 앱 기준 지도·검색 무료 쿼터 제공                     | 한국 중심 서비스에 강함, 세계지도 기본 공급자로는 부적합                             | 한국 검색 품질 보강 후보     |
| NAVER Cloud Maps 무료 쿼터   | Web Dynamic Map 등 무료 구간 제공                            | 한국 품질은 강하지만 세계 탐색·해외 검색은 별도 검증 필요                            | 한국 검색 품질 보강 후보     |
| OSM 공개 타일 + Nominatim    | 가벼운 개발 확인에는 사용할 수 있음                          | 공개 타일 대량 사용 금지, 공개 Nominatim은 클라이언트 자동완성 금지와 낮은 호출 제한 | 운영 제외, 아주 제한적 실험  |
| Natural Earth 등 정적 데이터 | 파일을 저장소나 로컬 자산으로 두고 세계지도 윤곽을 직접 그림 | 일반 지도 타일처럼 상세 도로·장소명은 없음                                           | 첫 무비용 지도 fallback 후보 |
| 자체 OSM 타일·검색 서버      | 라이선스상 가능                                              | 서버·스토리지·업데이트·운영 비용이 생김                                              | 현재 범위 제외               |

따라서 C10 구현은 `MapProvider`와 `PlaceSearchProvider`를 분리하고, 먼저 돈이 나가지 않는 지도 화면을 만든다. 기본 경로는 MapLibre GL JS이며, 토큰 없는 정적 세계지도 fallback도 둔다. 외부 지도 공급자 토큰이 없더라도 닉네임 → 세계지도 → 지도 조작 → 클릭 좌표 확정 흐름을 개발·검증할 수 있어야 한다.

## 3. 요구사항 기준

| 기준               | 필요한 이유                                                             |
| ------------------ | ----------------------------------------------------------------------- |
| 세계 범위          | 사용자는 지금 밤인 전 세계 위치를 탐색하고 클릭한다.                    |
| 부드러운 지도 조작 | 줌 인/아웃, 드래그, 모바일 스와이프, 검색 결과 이동이 기본 경험이다.    |
| 커스텀 레이어      | 낮·박명 밝기장, 동일 밤 영역, 관측자 핀, 선택 마커를 지도 위에 얹는다.  |
| 검색은 이동만      | 검색 결과는 지도를 이동·확대하고, 관측 좌표는 최종 클릭으로만 확정한다. |
| 비용 0원           | 개인 프로젝트이므로 과금 가능성이 있는 기본 경로를 피한다.              |
| 키 선택 사항       | 토큰이 없는 상태에서도 로컬 개발과 핵심 흐름 검증이 가능해야 한다.      |

## 4. 후보 비교

| 후보                        | 장점                                                               | 제약·위험                                                                                | 판단             |
| --------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- | ---------------- |
| MapLibre GL JS + 무료 타일  | 렌더링 라이브러리 무료·오픈소스, 커스텀 레이어 구현 쉬움           | 안정적인 무료 타일·검색 공급자를 따로 정해야 함                                          | MVP 우선 후보    |
| 정적 세계지도 fallback      | 토큰·계정·네트워크 비용 없이 좌표 선택 흐름 개발 가능              | 도로·장소명·상세 검색 없음, “Google Maps 같은” 조작감은 제한적                           | 로컬 fallback    |
| Mapbox GL JS + Geocoding v6 | 세계 범위, GL 레이어·스타일 제어, globe/mercator 선택, 무료 구간   | 한국 POI·상호 검색은 Google·네이버·카카오보다 약할 수 있음, 공개 토큰 제한 설정 필요     | 무료 쿼터형 대안 |
| Google Maps JS + Places     | 사용자에게 익숙한 조작감, 세계 검색과 한국어 검색 품질 기대치 높음 | 결제 활성화 필요, 지도 로드·Places SKU 과금, Places 결과 표시 제한                       | 현재 제외        |
| NAVER Cloud Maps            | 한국 지도·주소 품질 강함, 웹 동적 지도와 Geocoding 제공            | 세계 중심 제품에는 범위·해외 검색 품질 검증 필요, 네이버 클라우드 키·과금 체계 확인 필요 | 한국 보강 후보   |
| Kakao Map API               | 한국 장소 검색과 일 무료 쿼터가 실험에 유리                        | 전 세계 지도 제품의 기본 공급자로는 부적합, 첫 활성 앱·비즈월렛·초과 과금 조건 확인 필요 | 한국 보강 후보   |
| OSM 공개 타일 + Nominatim   | 오픈 데이터 기반, 자체 운영 시 제어 가능                           | 공개 타일·공개 Nominatim은 운영 트래픽과 자동완성에 부적합                               | 공개 서버 제외   |

## 5. 무비용 채택 범위

첫 구현은 MapLibre GL JS를 `MapProvider` 어댑터 안에 격리한다. React 화면은 MapLibre 객체를 직접 조작하지 않고 `MapController` 계약만 사용한다.

검색은 `PlaceSearchProvider` 계약으로 분리한다. C11의 첫 구현은 외부 유료 자동완성 대신 무료로 유지 가능한 방식으로 시작한다. 후보는 작은 내장 도시 목록 검색, 무료 공개 데이터 파일 기반 검색, 또는 사용자가 직접 확인한 무료 비상업 API다. 검색 결과 좌표나 이름을 장기 저장하지 않는다.

지도 타일 토큰이 없으면 토큰 없는 정적 세계지도 fallback을 보여준다. 이 fallback에서도 줌·드래그·클릭 좌표 확정의 핵심 흐름은 동작해야 한다. 외부 무료 타일을 사용할 때는 해당 공급자의 사용 조건을 문서에 추가하고, 로고·출처 표시를 가리지 않는다.

지도 투영은 처음에는 Web Mercator를 기본으로 검증한다. globe 표현은 세계감이 좋지만 낮·밤 경계, 날짜변경선, 극지 근처 선택, 관측자 핀 집계가 더 복잡할 수 있으므로 C10/C13에서 별도 판단한다.

## 6. 다음 구현 규칙

- 지도 공급자 토큰이 없으면 정적 세계지도 fallback을 사용한다. fallback은 임시 그림이 아니라 개발 중 핵심 흐름을 확인하는 공식 로컬 모드다.
- 지도 클릭 좌표는 SDK나 데이터의 `[lng, lat]` 순서를 앱의 `{ latitude, longitude }` 값으로 변환하는 경계에서만 바꾼다.
- 검색 결과는 `fitBounds` 또는 중심·줌 이동만 수행한다. 선택 위치는 해제하거나 유지 여부를 명시적으로 처리하고, 검색 성공만으로 밤하늘 진입 버튼을 활성화하지 않는다.
- 지도 타일 로드 실패와 검색 실패를 분리한다. 검색 실패는 지도 조작을 막지 않는다.
- 출처·로고·약관 링크는 공급자 기본 표시를 가리지 않는다.
- 밝기장과 관측자 핀은 공급자 SDK 레이어 뒤에 숨지 않도록 z-order를 C13/P02에서 검증한다.

## 7. 비용·정책 확인 메모

MapLibre GL JS는 지도 렌더링 라이브러리이며 타일·검색 데이터를 포함하지 않는다. 돈을 쓰지 않는 조건에서는 타일·검색 공급자를 붙일 때 무료 조건, 비상업 조건, 호출 제한을 먼저 확인한다.

Mapbox GL JS의 Web Map Load는 지도 객체 초기화 기준으로 계산되고, 현재 가격표에는 월 50,000 load까지 무료 구간이 있다. Temporary Geocoding API는 현재 가격표에 월 100,000 요청까지 무료 구간이 있다. Geocoding v6은 기본이 Temporary Geocoding이며, 임시 결과는 캐시할 수 없다. 자동완성을 켜면 각 키 입력이 지오코딩 요청으로 계산되므로 입력 최소 길이와 debounce가 필요하다. 현재 프로젝트는 비용 0원을 우선하므로 Mapbox는 기본 구현에서 제외하고, 필요 시 사용자가 계정·한도·과금 차단을 확인한 뒤 선택한다.

Google Maps JavaScript API는 사용량 기반 과금이며 지도 로드와 Places 기능이 별도 SKU로 계산된다. Places API 정책은 Places 결과를 지도에 표시할 때 Google Map에 표시해야 한다는 조건을 포함하므로, Google Places만 가져와 Mapbox 지도에 표시하는 조합은 기본 설계에서 제외한다.

Kakao Map API는 2026-07-21 이후 첫 활성 앱 기준 무료 쿼터 정책과 비즈월렛 기반 초과 사용 정책을 적용한다. Kakao 지도 Web SDK와 REST 장소 검색은 일 무료 쿼터가 크지만, 세계지도 기본 공급자보다 한국 검색 보강 후보로 다룬다.

NAVER Cloud Maps는 Web Dynamic Map과 Geocoding을 제공하고 한국 지도 품질이 강하다. 다만 이 프로젝트의 첫 구현은 세계 범위와 커스텀 밤/낮 레이어가 우선이므로 Mapbox를 먼저 쓴다.

OSM 공개 타일 서버는 대량 사전 다운로드와 식별 불가능한 트래픽을 금지하고, 공개 Nominatim은 절대 최대 1초 1요청과 클라이언트 자동완성 금지를 명시한다. 따라서 공개 OSM 인프라를 MVP 운영 기본값으로 삼지 않는다.

## 8. 참고한 공식 문서

- [MapLibre GL JS](https://maplibre.org/maplibre-gl-js/docs/)
- [MapTiler Cloud pricing](https://www.maptiler.com/cloud/pricing/)
- [Mapbox GL JS guide](https://docs.mapbox.com/mapbox-gl-js/guides/)
- [Mapbox Geocoding API v6](https://docs.mapbox.com/api/search/geocoding/)
- [Mapbox pricing](https://www.mapbox.com/pricing)
- [Google Maps JavaScript API usage and billing](https://developers.google.com/maps/documentation/javascript/usage-and-billing)
- [Google Places API policies](https://developers.google.com/maps/documentation/places/web-service/policies)
- [NAVER Cloud Maps overview](https://api.ncloud-docs.com/docs/en/application-maps-overview)
- [NAVER Cloud Dynamic Map](https://api.ncloud-docs.com/docs/en/application-maps-dynamic)
- [NAVER Cloud Geocoding](https://api.ncloud-docs.com/docs/en/ai-naver-mapsgeocoding-geocode)
- [Kakao Map concepts](https://developers.kakao.com/docs/en/kakaomap/common)
- [Kakao quota and pricing](https://developers.kakao.com/docs/en/getting-started/quota)
- [OSM tile usage policy](https://operations.osmfoundation.org/policies/tiles/)
- [Nominatim usage policy](https://operations.osmfoundation.org/policies/nominatim/)
