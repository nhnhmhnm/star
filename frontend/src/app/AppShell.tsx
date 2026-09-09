import type { ReactNode } from 'react'

import styles from './AppShell.module.css'
import { navigateTo } from './routing/navigation'
import type { AppPath } from './routing/routes'

interface AppShellProps {
  activePath: AppPath
  canOpenSky: boolean
  displayName: string
  children: ReactNode
}

export function AppShell({ activePath, canOpenSky, displayName, children }: AppShellProps) {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div>
          <p className={styles.brand}>Real Time Sky</p>
          <p className={styles.sessionName}>{displayName}</p>
        </div>
        <nav className={styles.nav} aria-label="주요 화면">
          <a
            className={styles.navLink}
            href="/"
            aria-current={activePath === '/' ? 'page' : undefined}
            onClick={(event) => {
              event.preventDefault()
              navigateTo('/')
            }}
          >
            세계지도
          </a>
          {canOpenSky ? (
            <a
              className={styles.navLink}
              href="/sky"
              aria-current={activePath === '/sky' ? 'page' : undefined}
              onClick={(event) => {
                event.preventDefault()
                navigateTo('/sky')
              }}
            >
              밤하늘
            </a>
          ) : null}
        </nav>
      </header>
      <main className={styles.content}>{children}</main>
    </div>
  )
}
