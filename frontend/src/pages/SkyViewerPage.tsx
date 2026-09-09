import type { SelectedObservationLocation } from '../app/observation/observationState'
import styles from './SkyViewerPage.module.css'

interface SkyViewerPageProps {
  selectedLocation: SelectedObservationLocation
}

export function SkyViewerPage({ selectedLocation }: SkyViewerPageProps) {
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
      </div>
    </section>
  )
}
