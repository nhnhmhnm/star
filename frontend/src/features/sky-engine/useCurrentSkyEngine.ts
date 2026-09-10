import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'

import type { SelectedObservationLocation } from '../../app/observation/observationState'
import { getNightEligibility } from '../night-eligibility/nightEligibility'
import {
  createStellariumSkyEngine,
  type CreateStellariumSkyEngineOptions,
  type SkyEngine,
  skyFovBounds,
  type SkyViewState,
} from './StellariumAdapter'

export type CurrentSkyStatus = 'loading' | 'ready' | 'blocked' | 'error'

export interface CurrentSkyState {
  status: CurrentSkyStatus
  message: string
  view: SkyViewState
  resetView(): void
  zoomIn(): void
  zoomOut(): void
}

interface UseCurrentSkyEngineOptions {
  canvasRef: RefObject<HTMLCanvasElement | null>
  createEngine?: (options: CreateStellariumSkyEngineOptions) => Promise<SkyEngine>
  location: SelectedObservationLocation
  nightAltitudeThresholdDeg: number
}

export function useCurrentSkyEngine({
  canvasRef,
  createEngine = createStellariumSkyEngine,
  location,
  nightAltitudeThresholdDeg,
}: UseCurrentSkyEngineOptions): CurrentSkyState {
  const engineRef = useRef<SkyEngine | null>(null)
  const [state, setState] = useState<CurrentSkyState>({
    status: 'loading',
    message: 'Stellarium engine is loading.',
    view: { fovDeg: skyFovBounds.initialDeg },
    resetView: () => undefined,
    zoomIn: () => undefined,
    zoomOut: () => undefined,
  })
  const syncViewState = useCallback(() => {
    const engine = engineRef.current

    if (!engine) {
      return
    }

    engine.enforceViewBounds()
    setState((current) => ({ ...current, view: engine.getView() }))
  }, [])
  const setFovDelta = useCallback(
    (deltaDeg: number) => {
      const engine = engineRef.current

      if (!engine) {
        return
      }

      engine.setFovDeg(engine.getView().fovDeg + deltaDeg)
      syncViewState()
    },
    [syncViewState],
  )
  const resetView = useCallback(() => {
    const engine = engineRef.current

    if (!engine) {
      return
    }

    engine.resetView()
    syncViewState()
  }, [syncViewState])
  const zoomIn = useCallback(() => setFovDelta(-10), [setFovDelta])
  const zoomOut = useCallback(() => setFovDelta(10), [setFovDelta])

  useEffect(() => {
    const canvas = canvasRef.current
    let disposed = false
    let engine: SkyEngine | null = null
    let viewSyncId: number | null = null

    if (!canvas) {
      return undefined
    }
    const canvasElement = canvas

    async function startEngine(): Promise<void> {
      engineRef.current = null
      setState((current) => ({
        ...current,
        status: 'loading',
        message: 'Stellarium engine is loading.',
        view: { fovDeg: skyFovBounds.initialDeg },
      }))

      const entryCheck = getNightEligibility(
        {
          latitudeDeg: location.latitudeDeg,
          longitudeDeg: location.longitudeDeg,
        },
        new Date(),
        nightAltitudeThresholdDeg,
      )

      if (!entryCheck.isEligible) {
        setState({
          status: 'blocked',
          message: formatBlockedMessage(entryCheck.solarAltitudeDeg, nightAltitudeThresholdDeg),
          view: { fovDeg: skyFovBounds.initialDeg },
          resetView,
          zoomIn,
          zoomOut,
        })
        return
      }

      try {
        const nextEngine = await createEngine({ canvas: canvasElement, location })

        if (disposed) {
          nextEngine.dispose()
          return
        }

        const firstFrameCheck = getNightEligibility(
          {
            latitudeDeg: location.latitudeDeg,
            longitudeDeg: location.longitudeDeg,
          },
          new Date(),
          nightAltitudeThresholdDeg,
        )

        if (!firstFrameCheck.isEligible) {
          nextEngine.dispose()
          setState({
            status: 'blocked',
            message: formatBlockedMessage(
              firstFrameCheck.solarAltitudeDeg,
              nightAltitudeThresholdDeg,
            ),
            view: { fovDeg: skyFovBounds.initialDeg },
            resetView,
            zoomIn,
            zoomOut,
          })
          return
        }

        engine = nextEngine
        engineRef.current = nextEngine
        engine.startRealtimeSync()
        setState({
          status: 'ready',
          message: 'The current sky is rendering.',
          view: engine.getView(),
          resetView,
          zoomIn,
          zoomOut,
        })
        viewSyncId = window.setInterval(syncViewState, 250)
      } catch (error) {
        if (disposed) {
          return
        }

        setState({
          status: 'error',
          message: error instanceof Error ? error.message : 'Stellarium engine failed to load.',
          view: { fovDeg: skyFovBounds.initialDeg },
          resetView,
          zoomIn,
          zoomOut,
        })
      }
    }

    const startEngineId = window.setTimeout(() => {
      void startEngine()
    }, 0)

    return () => {
      disposed = true
      window.clearTimeout(startEngineId)
      if (viewSyncId !== null) {
        window.clearInterval(viewSyncId)
      }
      engineRef.current = null
      engine?.dispose()
    }
  }, [
    canvasRef,
    createEngine,
    location,
    location.id,
    location.latitudeDeg,
    location.longitudeDeg,
    nightAltitudeThresholdDeg,
    resetView,
    syncViewState,
    zoomIn,
    zoomOut,
  ])

  return state
}

function formatBlockedMessage(solarAltitudeDeg: number, thresholdDeg: number): string {
  return `Solar altitude is ${solarAltitudeDeg.toFixed(1)} deg. Entry is allowed at ${thresholdDeg.toFixed(1)} deg or lower.`
}
