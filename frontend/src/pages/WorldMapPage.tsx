import { useState } from 'react'

import { useObservationDispatch } from '../app/observation/useObservation'
import type { MapFocusRequest } from '../features/map-explorer/useStaticWorldMap'
import { StaticWorldMap } from '../features/map-explorer/StaticWorldMap'
import { localPlaceSearchProvider } from '../features/place-search/localPlaceSearchProvider'
import { PlaceSearchBox } from '../features/place-search/PlaceSearchBox'
import type { PlaceSearchResult } from '../features/place-search/placeSearch'
import type { PublicAppConfig } from '../shared/api/publicConfig'
import styles from './WorldMapPage.module.css'

interface WorldMapPageProps {
  config: PublicAppConfig | null
  configError: string | null
}

export function WorldMapPage({ config, configError }: WorldMapPageProps) {
  const observationDispatch = useObservationDispatch()
  const [mapFocusRequest, setMapFocusRequest] = useState<MapFocusRequest | null>(null)

  function moveMapToSearchResult(result: PlaceSearchResult) {
    observationDispatch({ type: 'clearLocation' })
    setMapFocusRequest({
      id: `${result.id}-${Date.now()}`,
      center: result.coordinate,
      zoom: result.suggestedZoom,
    })
  }

  return (
    <section className={styles.page} aria-labelledby="map-title">
      <div className={styles.mapStage}>
        <StaticWorldMap
          key={mapFocusRequest?.id ?? 'static-world-map'}
          focusRequest={mapFocusRequest}
        />
      </div>
      <aside className={styles.sidePanel}>
        <p className={styles.eyebrow}>관측 위치 선택</p>
        <h1 className={styles.title} id="map-title">
          밤인 지역을 선택해 하늘을 엽니다
        </h1>
        <p className={styles.description}>
          세계지도에서 원하는 위치를 클릭하면 해당 좌표의 밤하늘로 입장합니다.
        </p>
        <p className={styles.status} aria-live="polite">
          {config
            ? `현재 기준: 태양 고도 ${config.nightAltitudeThresholdDeg}° 이하`
            : '공개 설정을 확인하는 중입니다.'}
        </p>
        <p className={styles.note}>
          현재 지도는 돈을 쓰지 않는 로컬 fallback입니다. 확대·축소와 드래그를 먼저 검증하고, 클릭
          좌표 확정은 다음 위치 선택 단계에서 연결합니다.
        </p>
        <PlaceSearchBox
          provider={localPlaceSearchProvider}
          onResultSelect={moveMapToSearchResult}
        />
        {configError ? <p className={styles.error}>{configError}</p> : null}
      </aside>
    </section>
  )
}
