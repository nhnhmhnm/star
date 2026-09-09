import { useState } from 'react'

import styles from './NicknameEntryPage.module.css'

interface NicknameEntryPageProps {
  error: string | null
  isSubmitting: boolean
  onSubmit: (nickname: string) => Promise<void>
}

export function NicknameEntryPage({ error, isSubmitting, onSubmit }: NicknameEntryPageProps) {
  const [nickname, setNickname] = useState('')

  return (
    <main className={styles.page} aria-labelledby="nickname-title">
      <section className={styles.panel}>
        <p className={styles.eyebrow}>첫 입장</p>
        <h1 className={styles.title} id="nickname-title">
          별을 볼 때 사용할 닉네임
        </h1>
        <p className={styles.description}>
          관측 중에는 닉네임과 근사 관측 위치가 세계지도에 표시됩니다.
        </p>
        <form
          className={styles.form}
          onSubmit={(event) => {
            event.preventDefault()
            void onSubmit(nickname)
          }}
        >
          <label className={styles.label} htmlFor="nickname">
            닉네임
          </label>
          <input
            className={styles.input}
            id="nickname"
            name="nickname"
            autoComplete="nickname"
            minLength={2}
            maxLength={20}
            value={nickname}
            onChange={(event) => setNickname(event.currentTarget.value)}
          />
          {error ? (
            <p className={styles.error} role="alert">
              {error}
            </p>
          ) : null}
          <button className={styles.button} type="submit" disabled={isSubmitting}>
            {isSubmitting ? '입장 준비 중' : '밤하늘 지도 시작'}
          </button>
        </form>
      </section>
    </main>
  )
}
