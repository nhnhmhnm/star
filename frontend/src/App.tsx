import { useEffect, useState } from 'react'

import styles from './App.module.css'
import { fetchPublicAppConfig, type PublicAppConfig } from './shared/api/publicConfig'

function App() {
  const [config, setConfig] = useState<PublicAppConfig | null>(null)
  const [configError, setConfigError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    fetchPublicAppConfig()
      .then((nextConfig) => {
        if (isMounted) {
          setConfig(nextConfig)
        }
      })
      .catch((error: unknown) => {
        if (isMounted) {
          setConfigError(
            error instanceof Error ? error.message : '공개 설정을 불러오지 못했습니다.',
          )
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <main className={styles.app} aria-labelledby="app-title">
      <section className={styles.panel}>
        <p className={styles.eyebrow}>개발 환경 준비</p>
        <h1 id="app-title">Real Time Sky</h1>
        <p className={styles.description}>
          문서의 구현 순서에 맞춰 React, TypeScript, Vite 기반을 준비했습니다.
        </p>
        <p className={styles.configStatus} aria-live="polite">
          {config
            ? `밤하늘 진입 기준: 태양 고도 ${config.nightAltitudeThresholdDeg}° 이하`
            : '공개 설정을 확인하는 중입니다.'}
        </p>
        {configError ? <p className={styles.error}>{configError}</p> : null}
      </section>
    </main>
  )
}

export default App
