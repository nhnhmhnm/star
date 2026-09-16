import { navigateTo } from '../app/routing/navigation'
import styles from './LandingPage.module.css'

export function LandingPage() {
  return (
    <main className={styles.page}>
      <div className={styles.shade} aria-hidden="true" />
      <section className={styles.introCard} aria-labelledby="landing-title">
        <p className={styles.eyebrow}>LIVE ASTRONOMY EXPERIENCE</p>
        <h1 id="landing-title">Real Time Sky</h1>
        <p className={styles.description}>
          세계지도에서 지금 밤인 위치를 선택하고,
          <br />
          그곳에서 보이는 실시간 밤하늘을 감상해 보세요.
        </p>
        <div className={styles.guide}>
          <span>위치 선택</span>
          <span aria-hidden="true">→</span>
          <span>밤하늘 관측</span>
        </div>
        <a
          className={styles.enterButton}
          href="/map"
          onClick={(event) => {
            event.preventDefault()
            navigateTo('/map')
          }}
        >
          입장하기
          <span aria-hidden="true">↗</span>
        </a>
      </section>
      <p className={styles.caption}>LOOK UP · FIND YOUR NIGHT</p>
    </main>
  )
}
