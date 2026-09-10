import { useRef } from 'react'

import type { SelectedObservationLocation } from '../app/observation/observationState'
import { useObservationPresence } from '../features/presence/useObservationPresence'
import { useCurrentSkyEngine } from '../features/sky-engine/useCurrentSkyEngine'
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
      </div>
      {sky.status !== 'ready' ? (
        <div className={styles.overlay} role="status" aria-live="polite">
          <p className={styles.overlayTitle}>{formatSkyStatusTitle(sky.status)}</p>
          <p className={styles.overlayMessage}>{sky.message}</p>
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
