import { useEffect, useState } from 'react'

import { AppShell } from './app/AppShell'
import { ObservationProvider } from './app/observation/ObservationProvider'
import { useObservationState } from './app/observation/useObservation'
import { navigateTo } from './app/routing/navigation'
import { useRoute } from './app/routing/useRoute'
import { useVisitorSession } from './features/visitor-session/useVisitorSession'
import { NicknameEntryPage } from './pages/NicknameEntryPage'
import { SkyViewerPage } from './pages/SkyViewerPage'
import { WorldMapPage } from './pages/WorldMapPage'
import { fetchPublicAppConfig, type PublicAppConfig } from './shared/api/publicConfig'

function App() {
  return (
    <ObservationProvider>
      <RoutedApp />
    </ObservationProvider>
  )
}

function RoutedApp() {
  const route = useRoute()
  const observation = useObservationState()
  const selectedLocation = observation.selectedLocation
  const visitorSession = useVisitorSession()
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

  useEffect(() => {
    if (route.path === '/sky' && !selectedLocation) {
      navigateTo('/')
    }
  }, [route.path, selectedLocation])

  const shouldShowSky = route.path === '/sky' && selectedLocation !== null

  if (!visitorSession.session) {
    return (
      <NicknameEntryPage
        error={visitorSession.error}
        isSubmitting={visitorSession.isSubmitting}
        onSubmit={visitorSession.submitNickname}
      />
    )
  }

  return (
    <AppShell
      activePath={shouldShowSky ? '/sky' : '/'}
      canOpenSky={selectedLocation !== null}
      displayName={visitorSession.session.displayName}
    >
      {shouldShowSky ? (
        <SkyViewerPage selectedLocation={selectedLocation} />
      ) : (
        <WorldMapPage config={config} configError={configError} />
      )}
    </AppShell>
  )
}

export default App
