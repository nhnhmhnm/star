import { useEffect, useState } from 'react'

import { AppShell } from './app/AppShell'
import { ObservationProvider } from './app/observation/ObservationProvider'
import { useObservationState } from './app/observation/useObservation'
import { navigateTo } from './app/routing/navigation'
import { useRoute } from './app/routing/useRoute'
import { getNightEligibility } from './features/night-eligibility/nightEligibility'
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
  const [config, setConfig] = useState<PublicAppConfig | null>(null)
  const [configError, setConfigError] = useState<string | null>(null)
  const selectedLocationCanOpenSky =
    selectedLocation !== null && config !== null
      ? getNightEligibility(
          {
            latitudeDeg: selectedLocation.latitudeDeg,
            longitudeDeg: selectedLocation.longitudeDeg,
          },
          new Date(),
          config.nightAltitudeThresholdDeg,
        ).isEligible
      : false

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
    if (route.path === '/sky' && !selectedLocationCanOpenSky) {
      navigateTo('/')
    }
  }, [route.path, selectedLocationCanOpenSky])

  const shouldShowSky =
    route.path === '/sky' &&
    selectedLocation !== null &&
    config !== null &&
    selectedLocationCanOpenSky

  return (
    <AppShell activePath={shouldShowSky ? '/sky' : '/'} canOpenSky={selectedLocationCanOpenSky}>
      {shouldShowSky ? (
        <SkyViewerPage config={config} selectedLocation={selectedLocation} />
      ) : (
        <WorldMapPage config={config} configError={configError} />
      )}
    </AppShell>
  )
}

export default App
