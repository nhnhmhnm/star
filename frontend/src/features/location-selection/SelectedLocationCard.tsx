import { navigateTo } from '../../app/routing/navigation'
import type { SelectedObservationLocation } from '../../app/observation/observationState'
import type { NightEligibilityResult } from '../night-eligibility/nightEligibility'
import styles from './SelectedLocationCard.module.css'

interface SelectedLocationCardProps {
  location: SelectedObservationLocation | null
  eligibility: NightEligibilityResult | null
  configError: string | null
  onClear: () => void
}

export function SelectedLocationCard({
  location,
  eligibility,
  configError,
  onClear,
}: SelectedLocationCardProps) {
  if (!location) {
    return (
      <section className={styles.card} aria-live="polite">
        <h2>선택된 위치 없음</h2>
        <p>지도에서 최종 관측할 위치를 클릭하면 좌표와 현재 관측 가능 여부를 확인합니다.</p>
      </section>
    )
  }

  const canEnterSky = eligibility?.isEligible === true && !configError

  return (
    <section className={styles.card} aria-live="polite">
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>선택 좌표</p>
          <h2>{location.label}</h2>
        </div>
        <button type="button" className={styles.clearButton} onClick={onClear}>
          선택 해제
        </button>
      </div>
      <dl className={styles.coordinates}>
        <div>
          <dt>위도</dt>
          <dd>{location.latitudeDeg.toFixed(4)}°</dd>
        </div>
        <div>
          <dt>경도</dt>
          <dd>{location.longitudeDeg.toFixed(4)}°</dd>
        </div>
      </dl>
      {configError ? <p className={styles.error}>공개 설정 오류: {configError}</p> : null}
      {!configError && eligibility ? (
        <p className={canEnterSky ? styles.available : styles.blocked}>
          현재 태양 고도 {eligibility.solarAltitudeDeg.toFixed(1)}° ·{' '}
          {canEnterSky ? '관측 가능' : '아직 밝음'}
        </p>
      ) : null}
      {!configError && !eligibility ? (
        <p className={styles.pending}>공개 설정을 확인한 뒤 현재 밤 여부를 판정합니다.</p>
      ) : null}
      <button
        type="button"
        className={styles.enterButton}
        disabled={!canEnterSky}
        onClick={() => navigateTo('/sky')}
      >
        이 위치의 밤하늘 보기
      </button>
    </section>
  )
}
