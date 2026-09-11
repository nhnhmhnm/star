import { useState } from 'react'

import { useObservationDispatch, useObservationState } from '../app/observation/useObservation'
import { navigateTo } from '../app/routing/navigation'
import type { GeoCoordinate } from '../features/map-explorer/mapProjection'
import type { MapFocusRequest } from '../features/map-explorer/useStaticWorldMap'
import { StaticWorldMap } from '../features/map-explorer/StaticWorldMap'
import { getNightEligibility } from '../features/night-eligibility/nightEligibility'
import { localPlaceSearchProvider } from '../features/place-search/localPlaceSearchProvider'
import { PlaceSearchBox } from '../features/place-search/PlaceSearchBox'
import type { PlaceDisplayLanguage } from '../features/place-search/placeSearch'
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
  const [language, setLanguage] = useState<PlaceDisplayLanguage>('ko')
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
        label: formatCoordinateLabel(coordinate, language),
        latitudeDeg: coordinate.latitudeDeg,
        longitudeDeg: coordinate.longitudeDeg,
      },
    })
  }

  function clearSelectedCoordinate() {
    observationDispatch({ type: 'clearLocation' })
  }

  const canEnterSky = selectedEligibility?.isEligible === true && !configError

  return (
    <section className={styles.page} aria-label="세계지도">
      <div className={styles.mapStage}>
        <StaticWorldMap
          key={mapFocusRequest?.id ?? 'static-world-map'}
          focusRequest={mapFocusRequest}
          nightAltitudeThresholdDeg={config?.nightAltitudeThresholdDeg ?? null}
          selectedCoordinate={selectedLocation}
          selectedPopup={
            selectedLocation ? (
              <SelectedCoordinatePopup
                canEnterSky={canEnterSky}
                configError={configError}
                coordinate={selectedLocation}
                eligibility={selectedEligibility}
                language={language}
                onClear={clearSelectedCoordinate}
              />
            ) : null
          }
          onCoordinateSelect={selectObservationCoordinate}
        />
      </div>
      <div className={styles.topBanner}>
        <div className={styles.languageGroup} aria-label="지도 표시 언어">
          <button
            type="button"
            className={language === 'ko' ? styles.activeLanguageButton : styles.languageButton}
            aria-pressed={language === 'ko'}
            onClick={() => setLanguage('ko')}
          >
            한국어
          </button>
          <button
            type="button"
            className={language === 'en' ? styles.activeLanguageButton : styles.languageButton}
            aria-pressed={language === 'en'}
            onClick={() => setLanguage('en')}
          >
            English
          </button>
        </div>
        <div className={styles.tip} tabIndex={0}>
          <span className={styles.tipButton}>팁</span>
          <div className={styles.tipPanel} role="tooltip">
            <p>밤인 지역을 선택해 하늘을 봅니다.</p>
            <p>현재 기준: 태양 고도 {config?.nightAltitudeThresholdDeg ?? '-'}° 이하</p>
            <p>
              지도 밝기는 입장 시각의 태양 고도를 계산한 안내 레이어입니다. 관측 가능 여부는 클릭한
              좌표에서 현재 시각으로 다시 판정합니다.
            </p>
          </div>
        </div>
        <PlaceSearchBox
          language={language}
          provider={localPlaceSearchProvider}
          onResultSelect={moveMapToSearchResult}
        />
      </div>
    </section>
  )
}

interface SelectedCoordinatePopupProps {
  canEnterSky: boolean
  configError: string | null
  coordinate: GeoCoordinate
  eligibility: ReturnType<typeof getNightEligibility> | null
  language: PlaceDisplayLanguage
  onClear: () => void
}

function SelectedCoordinatePopup({
  canEnterSky,
  configError,
  coordinate,
  eligibility,
  language,
  onClear,
}: SelectedCoordinatePopupProps) {
  return (
    <aside className={styles.coordinatePopup} aria-live="polite">
      <button
        type="button"
        className={styles.popupCloseButton}
        aria-label="선택 해제"
        onClick={onClear}
      >
        ×
      </button>
      <p className={styles.popupEyebrow}>{language === 'ko' ? '선택 좌표' : 'Selected point'}</p>
      <h2>{formatCoordinateLabel(coordinate, language)}</h2>
      {configError ? <p className={styles.popupError}>{configError}</p> : null}
      {!configError && eligibility ? (
        <p className={canEnterSky ? styles.popupAvailable : styles.popupBlocked}>
          {language === 'ko'
            ? `현재 태양 고도 ${eligibility.solarAltitudeDeg.toFixed(1)}° · ${
                canEnterSky ? '관측 가능' : '아직 밝음'
              }`
            : `Solar altitude ${eligibility.solarAltitudeDeg.toFixed(1)}° · ${
                canEnterSky ? 'Available' : 'Too bright'
              }`}
        </p>
      ) : null}
      <button
        type="button"
        className={styles.enterButton}
        disabled={!canEnterSky}
        onClick={() => navigateTo('/sky')}
      >
        {language === 'ko' ? '이 위치의 밤하늘 보기' : 'View sky here'}
      </button>
    </aside>
  )
}

function formatCoordinateLabel(coordinate: GeoCoordinate, language: PlaceDisplayLanguage): string {
  if (language === 'en') {
    return `Lat ${coordinate.latitudeDeg.toFixed(2)}°, Lng ${coordinate.longitudeDeg.toFixed(2)}°`
  }

  return `위도 ${coordinate.latitudeDeg.toFixed(2)}°, 경도 ${coordinate.longitudeDeg.toFixed(2)}°`
}
