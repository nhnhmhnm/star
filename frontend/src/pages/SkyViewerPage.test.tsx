import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  getCardinalDirectionCode,
  getCompassDirectionWindow,
} from '../features/sky-engine/skyCompass'
import { useCurrentSkyEngine } from '../features/sky-engine/useCurrentSkyEngine'
import { SkyViewerPage } from './SkyViewerPage'

vi.mock('../features/sky-engine/useCurrentSkyEngine')

afterEach(() => {
  cleanup()
})

describe('getCardinalDirectionCode', () => {
  it('follows the east, south, west, north panorama order', () => {
    expect(getCardinalDirectionCode(90)).toBe('E')
    expect(getCardinalDirectionCode(180)).toBe('S')
    expect(getCardinalDirectionCode(270)).toBe('W')
    expect(getCardinalDirectionCode(360)).toBe('N')
    expect(getCardinalDirectionCode(450)).toBe('E')
  })

  it('places the current direction between its horizontal neighbors', () => {
    expect(getCompassDirectionWindow(180)).toEqual(['E', 'S', 'W'])
    expect(getCompassDirectionWindow(270)).toEqual(['S', 'W', 'N'])
    expect(getCompassDirectionWindow(0)).toEqual(['W', 'N', 'E'])
  })
})

describe('SkyViewerPage keyboard controls', () => {
  it('uses the up and down arrow keys for zoom', () => {
    const zoomIn = vi.fn()
    const zoomOut = vi.fn()

    vi.mocked(useCurrentSkyEngine).mockReturnValue({
      status: 'ready',
      message: 'ready',
      constellationLayers: { labelsVisible: true, linesVisible: true },
      view: { altitudeDeg: 45, azimuthDeg: 180, fovDeg: 70 },
      panHorizontal: vi.fn(),
      resetView: vi.fn(),
      retry: vi.fn(),
      setConstellationLabelsVisible: vi.fn(),
      setConstellationLinesVisible: vi.fn(),
      zoomIn,
      zoomOut,
    })

    render(
      <SkyViewerPage
        config={{
          nightAltitudeThresholdDeg: -18,
          presenceCellSizeDeg: 0.25,
          presenceHeartbeatSeconds: 20,
        }}
        selectedLocation={{
          id: 'test-location',
          label: 'Test location',
          latitudeDeg: 0,
          longitudeDeg: 180,
        }}
      />,
    )

    const interactionSurface = screen.getByRole('application')
    fireEvent.keyDown(interactionSurface, { key: 'ArrowUp' })
    fireEvent.keyDown(interactionSurface, { key: 'ArrowDown' })
    fireEvent.keyDown(interactionSurface, { key: '+' })
    fireEvent.keyDown(interactionSurface, { key: '-' })

    expect(zoomIn).toHaveBeenCalledOnce()
    expect(zoomOut).toHaveBeenCalledOnce()
  })
})
