import { act, cleanup, render, screen } from '@testing-library/react'
import { useRef } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { SelectedObservationLocation } from '../../app/observation/observationState'
import type { CreateStellariumSkyEngineOptions, SkyEngine } from './StellariumAdapter'
import { useCurrentSkyEngine } from './useCurrentSkyEngine'

const nightLocation: SelectedObservationLocation = {
  id: 'night',
  label: 'Night test point',
  latitudeDeg: 0,
  longitudeDeg: 180,
}

const dayLocation: SelectedObservationLocation = {
  id: 'day',
  label: 'Day test point',
  latitudeDeg: 0,
  longitudeDeg: 0,
}

function TestViewer({
  createEngine,
  location,
}: {
  createEngine: (options: CreateStellariumSkyEngineOptions) => Promise<SkyEngine>
  location: SelectedObservationLocation
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const sky = useCurrentSkyEngine({
    canvasRef,
    createEngine,
    location,
    nightAltitudeThresholdDeg: -18,
  })

  return (
    <>
      <canvas ref={canvasRef} />
      <p>{sky.status}</p>
      <p>{sky.message}</p>
    </>
  )
}

describe('useCurrentSkyEngine', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-03-20T12:00:00.000Z'))
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('starts the Stellarium engine when the selected location is currently night', async () => {
    const engine: SkyEngine = {
      dispose: vi.fn(),
      startRealtimeSync: vi.fn(),
      syncCurrentTime: vi.fn(),
    }
    const createEngine = vi.fn<() => Promise<SkyEngine>>().mockResolvedValue(engine)

    render(<TestViewer createEngine={createEngine} location={nightLocation} />)

    await act(async () => {
      await Promise.resolve()
    })

    expect(await screen.findByText('ready')).toBeInTheDocument()
    expect(createEngine).toHaveBeenCalledOnce()
    expect(engine.startRealtimeSync).toHaveBeenCalledOnce()
  })

  it('blocks before loading Stellarium when the selected location is currently day', async () => {
    const createEngine = vi.fn<() => Promise<SkyEngine>>()

    render(<TestViewer createEngine={createEngine} location={dayLocation} />)

    await act(async () => {
      await Promise.resolve()
    })

    expect(await screen.findByText('blocked')).toBeInTheDocument()
    expect(createEngine).not.toHaveBeenCalled()
  })
})
