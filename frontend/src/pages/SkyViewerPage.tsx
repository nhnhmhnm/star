import type { SelectedObservationLocation } from '../app/observation/observationState'
import { useObservationPresence } from '../features/presence/useObservationPresence'
import type { VisitorSession } from '../features/visitor-session/visitorSession'
import styles from './SkyViewerPage.module.css'

interface SkyViewerPageProps {
  selectedLocation: SelectedObservationLocation
  visitorSession: VisitorSession
}

export function SkyViewerPage({ selectedLocation, visitorSession }: SkyViewerPageProps) {
  const presenceStatus = useObservationPresence({
    location: selectedLocation,
    session: visitorSession,
  })

  return (
    <section className={styles.page} aria-labelledby="sky-title">
      <div className={styles.viewerShell}>
        <p className={styles.eyebrow}>{selectedLocation.label}</p>
        <h1 className={styles.title} id="sky-title">
          밤하늘 준비 중
        </h1>
        <p className={styles.description}>
          위도 {selectedLocation.latitudeDeg.toFixed(4)}°, 경도{' '}
          {selectedLocation.longitudeDeg.toFixed(4)}° 기준으로 Stellarium 엔진을 연결합니다.
        </p>
        <p className={styles.presence}>
          관측 중 상태: {formatPresenceStatus(presenceStatus)} · 지도에는 근사 위치만 공개됩니다.
        </p>
      </div>
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
      return '연결 종료'
    case 'unavailable':
      return '연결 불가'
  }
}
