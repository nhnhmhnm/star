import { useRef } from 'react'

import type { SelectedObservationLocation } from '../app/observation/observationState'
import { useObservationPresence } from '../features/presence/useObservationPresence'
import { useCurrentSkyEngine } from '../features/sky-engine/useCurrentSkyEngine'
import { skyFovBounds } from '../features/sky-engine/StellariumAdapter'
import type { VisitorSession } from '../features/visitor-session/visitorSession'
import type { PublicAppConfig } from '../shared/api/publicConfig'
import styles from './SkyViewerPage.module.css'

interface SkyViewerPageProps {
  config: PublicAppConfig
  selectedLocation: SelectedObservationLocation
  visitorSession: VisitorSession
}

export function SkyViewerPage({ config, selectedLocation, visitorSession }: SkyViewerPageProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const sky = useCurrentSkyEngine({
    canvasRef,
    location: selectedLocation,
    nightAltitudeThresholdDeg: config.nightAltitudeThresholdDeg,
  })
  const presenceStatus = useObservationPresence({
    cellSizeDeg: config.presenceCellSizeDeg,
    enabled: sky.status === 'ready',
    heartbeatSeconds: config.presenceHeartbeatSeconds,
    location: selectedLocation,
    session: visitorSession,
  })
  const canvasClassName =
    sky.status === 'ready' ? styles.canvas : `${styles.canvas} ${styles.canvasHidden}`

  return (
    <section className={styles.page} aria-labelledby="sky-title">
      <canvas
        ref={canvasRef}
        aria-label={`${selectedLocation.label} 현재 밤하늘`}
        className={canvasClassName}
      />
      <div className={styles.statusPanel}>
        <p className={styles.eyebrow}>{selectedLocation.label}</p>
        <h1 className={styles.title} id="sky-title">
          현재 밤하늘
        </h1>
        <p className={styles.description}>
          위도 {selectedLocation.latitudeDeg.toFixed(4)}°, 경도{' '}
          {selectedLocation.longitudeDeg.toFixed(4)}°
        </p>
        <p className={styles.presence} aria-live="polite">
          관측 상태: {formatPresenceStatus(presenceStatus)}
        </p>
        {sky.status === 'ready' ? (
          <>
            <div className={styles.controls} aria-label="하늘 방향과 확대 조작">
              <button
                type="button"
                className={styles.controlButton}
                onClick={sky.zoomOut}
                disabled={sky.view.fovDeg >= skyFovBounds.maximumDeg}
                aria-label="축소"
                title="축소"
              >
                −
              </button>
              <button
                type="button"
                className={styles.controlButton}
                onClick={sky.resetView}
                aria-label="초기 시선으로 복구"
                title="초기 시선으로 복구"
              >
                ↺
              </button>
              <button
                type="button"
                className={styles.controlButton}
                onClick={sky.zoomIn}
                disabled={sky.view.fovDeg <= skyFovBounds.minimumDeg}
                aria-label="확대"
                title="확대"
              >
                +
              </button>
              <span className={styles.fovValue}>FOV {Math.round(sky.view.fovDeg)}°</span>
            </div>
            <div className={styles.layerControls} aria-label="별자리 표시">
              <button
                type="button"
                className={styles.toggleButton}
                aria-pressed={sky.constellationLayers.linesVisible}
                onClick={() =>
                  sky.setConstellationLinesVisible(!sky.constellationLayers.linesVisible)
                }
              >
                별자리 선
              </button>
              <button
                type="button"
                className={styles.toggleButton}
                aria-pressed={sky.constellationLayers.labelsVisible}
                onClick={() =>
                  sky.setConstellationLabelsVisible(!sky.constellationLayers.labelsVisible)
                }
              >
                별자리 이름
              </button>
            </div>
          </>
        ) : null}
      </div>
      {sky.status !== 'ready' ? (
        <div className={styles.overlay} role="status" aria-live="polite">
          <p className={styles.overlayTitle}>{formatSkyStatusTitle(sky.status)}</p>
          <p className={styles.overlayMessage}>{sky.message}</p>
          {sky.status === 'error' ? (
            <div className={styles.overlayActions}>
              <button type="button" className={styles.retryButton} onClick={sky.retry}>
                다시 시도
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}

function formatPresenceStatus(status: ReturnType<typeof useObservationPresence>): string {
  switch (status) {
    case 'connecting':
      return '연결 중'
    case 'connected':
      return '공개 중'
    case 'disconnected':
      return '대기 중'
    case 'unavailable':
      return '연결 불가'
  }
}

function formatSkyStatusTitle(status: ReturnType<typeof useCurrentSkyEngine>['status']): string {
  switch (status) {
    case 'loading':
      return '밤하늘을 불러오는 중'
    case 'blocked':
      return '현재 기준으로 관측할 수 없음'
    case 'error':
      return 'Stellarium 엔진을 불러오지 못함'
    case 'ready':
      return '현재 밤하늘'
  }
}
