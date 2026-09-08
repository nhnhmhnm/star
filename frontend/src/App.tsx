import styles from './App.module.css'

function App() {
  return (
    <main className={styles.app} aria-labelledby="app-title">
      <section className={styles.panel}>
        <p className={styles.eyebrow}>개발 환경 준비</p>
        <h1 id="app-title">Real Time Sky</h1>
        <p className={styles.description}>
          문서의 구현 순서에 맞춰 React, TypeScript, Vite 기반을 준비했습니다.
        </p>
      </section>
    </main>
  )
}

export default App
