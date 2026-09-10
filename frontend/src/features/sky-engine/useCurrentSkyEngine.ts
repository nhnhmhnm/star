import { useEffect, useState, type RefObject } from 'react'

import type { SelectedObservationLocation } from '../../app/observation/observationState'
import { getNightEligibility } from '../night-eligibility/nightEligibility'
import {
  createStellariumSkyEngine,
  type CreateStellariumSkyEngineOptions,
  type SkyEngine,
} from './StellariumAdapter'

export type CurrentSkyStatus = 'loading' | 'ready' | 'blocked' | 'error'

export interface CurrentSkyState {
  status: CurrentSkyStatus
  message: string
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
  const [state, setState] = useState<CurrentSkyState>({
    status: 'loading',
    message: 'Stellarium engine is loading.',
  })

  useEffect(() => {
    const canvas = canvasRef.current
    let disposed = false
    let engine: SkyEngine | null = null

    if (!canvas) {
      return undefined
    }
    const canvasElement = canvas

    async function startEngine(): Promise<void> {
      setState({ status: 'loading', message: 'Stellarium engine is loading.' })

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
          })
          return
        }

        engine = nextEngine
        engine.startRealtimeSync()
        setState({ status: 'ready', message: 'The current sky is rendering.' })
      } catch (error) {
        if (disposed) {
          return
        }

        setState({
          status: 'error',
          message: error instanceof Error ? error.message : 'Stellarium engine failed to load.',
        })
      }
    }

    const startEngineId = window.setTimeout(() => {
      void startEngine()
    }, 0)

    return () => {
      disposed = true
      window.clearTimeout(startEngineId)
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
  ])

  return state
}

function formatBlockedMessage(solarAltitudeDeg: number, thresholdDeg: number): string {
  return `Solar altitude is ${solarAltitudeDeg.toFixed(1)} deg. Entry is allowed at ${thresholdDeg.toFixed(1)} deg or lower.`
}
