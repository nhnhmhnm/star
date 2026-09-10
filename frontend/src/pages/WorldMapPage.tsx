import { useState } from 'react'

import { useObservationDispatch, useObservationState } from '../app/observation/useObservation'
import { SelectedLocationCard } from '../features/location-selection/SelectedLocationCard'
import type { GeoCoordinate } from '../features/map-explorer/mapProjection'
import type { MapFocusRequest } from '../features/map-explorer/useStaticWorldMap'
import { StaticWorldMap } from '../features/map-explorer/StaticWorldMap'
import { getNightEligibility } from '../features/night-eligibility/nightEligibility'
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
  const observation = useObservationState()
  const [mapFocusRequest, setMapFocusRequest] = useState<MapFocusRequest | null>(null)
  const selectedLocation = observation.selectedLocation
  const selectedEligibility =
    selectedLocation && config
      ? getNightEligibility(
          {
            latitudeDeg: selectedLocation.latitudeDeg,
            longitudeDeg: selectedLocation.longitudeDeg,
          },
          new Date(),
          config.nightAltitudeThresholdDeg,
        )
      : null

  function moveMapToSearchResult(result: PlaceSearchResult) {
    observationDispatch({ type: 'clearLocation' })
    setMapFocusRequest({
      id: `${result.id}-${Date.now()}`,
      center: result.coordinate,
      zoom: result.suggestedZoom,
    })
  }

  function selectObservationCoordinate(coordinate: GeoCoordinate) {
    observationDispatch({
      type: 'selectLocation',
      location: {
        id: `manual-${coordinate.latitudeDeg.toFixed(4)}-${coordinate.longitudeDeg.toFixed(4)}`,
        label: `위도 ${coordinate.latitudeDeg.toFixed(2)}°, 경도 ${coordinate.longitudeDeg.toFixed(2)}°`,
        latitudeDeg: coordinate.latitudeDeg,
        longitudeDeg: coordinate.longitudeDeg,
      },
    })
  }

  return (
    <section className={styles.page} aria-labelledby="map-title">
      <div className={styles.mapStage}>
        <StaticWorldMap
          key={mapFocusRequest?.id ?? 'static-world-map'}
          focusRequest={mapFocusRequest}
          nightAltitudeThresholdDeg={config?.nightAltitudeThresholdDeg ?? null}
          selectedCoordinate={selectedLocation}
          onCoordinateSelect={selectObservationCoordinate}
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
          지도 밝기는 입장 시각의 태양 고도를 계산한 안내 레이어입니다. 관측 가능 여부는 클릭한
          좌표에서 현재 시각으로 다시 판정합니다.
        </p>
        <PlaceSearchBox
          provider={localPlaceSearchProvider}
          onResultSelect={moveMapToSearchResult}
        />
        <SelectedLocationCard
          location={selectedLocation}
          eligibility={selectedEligibility}
          configError={configError}
          onClear={() => observationDispatch({ type: 'clearLocation' })}
        />
        {configError ? <p className={styles.error}>{configError}</p> : null}
      </aside>
    </section>
  )
}
