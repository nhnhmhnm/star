import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
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
      <p>FOV {sky.view.fovDeg}</p>
      <p>lines {String(sky.constellationLayers.linesVisible)}</p>
      <p>labels {String(sky.constellationLayers.labelsVisible)}</p>
      <button type="button" onClick={sky.zoomIn}>
        zoom in
      </button>
      <button type="button" onClick={sky.resetView}>
        reset
      </button>
      <button type="button" onClick={() => sky.setConstellationLinesVisible(false)}>
        hide lines
      </button>
      <button type="button" onClick={() => sky.setConstellationLabelsVisible(false)}>
        hide labels
      </button>
    </>
  )
}

function createFakeEngine(initialFovDeg = 70): SkyEngine {
  let fovDeg = initialFovDeg
  let constellationLayers = { labelsVisible: true, linesVisible: true }

  return {
    dispose: vi.fn(),
    enforceViewBounds: vi.fn(),
    getConstellationLayers: vi.fn(() => constellationLayers),
    getView: vi.fn(() => ({ fovDeg })),
    resetView: vi.fn(() => {
      fovDeg = 70
    }),
    setConstellationLayers: vi.fn((nextLayers) => {
      constellationLayers = nextLayers
    }),
    setFovDeg: vi.fn((nextFovDeg: number) => {
      fovDeg = nextFovDeg
    }),
    startRealtimeSync: vi.fn(),
    syncCurrentTime: vi.fn(),
  }
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
    const engine = createFakeEngine()
    const createEngine = vi.fn<() => Promise<SkyEngine>>().mockResolvedValue(engine)

    render(<TestViewer createEngine={createEngine} location={nightLocation} />)

    await act(async () => {
      await Promise.resolve()
    })

    expect(await screen.findByText('ready')).toBeInTheDocument()
    expect(createEngine).toHaveBeenCalledOnce()
    expect(engine.startRealtimeSync).toHaveBeenCalledOnce()
  })

  it('exposes zoom and reset actions for the ready sky engine', async () => {
    const engine = createFakeEngine()
    const createEngine = vi.fn<() => Promise<SkyEngine>>().mockResolvedValue(engine)

    render(<TestViewer createEngine={createEngine} location={nightLocation} />)

    expect(await screen.findByText('ready')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'zoom in' }))
    expect(engine.setFovDeg).toHaveBeenCalledWith(60)

    fireEvent.click(screen.getByRole('button', { name: 'reset' }))
    expect(engine.resetView).toHaveBeenCalledOnce()
  })

  it('exposes independent constellation line and label toggles', async () => {
    const engine = createFakeEngine()
    const createEngine = vi.fn<() => Promise<SkyEngine>>().mockResolvedValue(engine)

    render(<TestViewer createEngine={createEngine} location={nightLocation} />)

    expect(await screen.findByText('ready')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'hide lines' }))
    expect(engine.setConstellationLayers).toHaveBeenCalledWith({
      labelsVisible: true,
      linesVisible: false,
    })

    fireEvent.click(screen.getByRole('button', { name: 'hide labels' }))
    expect(engine.setConstellationLayers).toHaveBeenCalledWith({
      labelsVisible: false,
      linesVisible: false,
    })
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
