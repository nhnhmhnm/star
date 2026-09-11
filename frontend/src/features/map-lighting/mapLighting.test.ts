import { describe, expect, it } from 'vitest'

import { createLightingCells, getMapLightingBand } from './mapLighting'

describe('mapLighting', () => {
  it('uses one identical night band for every altitude below the configured threshold', () => {
    expect(getMapLightingBand(-18, -18)).toBe('night')
    expect(getMapLightingBand(-45, -18)).toBe('night')
    expect(getMapLightingBand(-89, -18)).toBe('night')
  })

  it('classifies daylight and twilight bands above the configured night threshold', () => {
    expect(getMapLightingBand(10, -18)).toBe('day')
    expect(getMapLightingBand(-1, -18)).toBe('civil-twilight')
    expect(getMapLightingBand(-8, -18)).toBe('nautical-twilight')
    expect(getMapLightingBand(-15, -18)).toBe('astronomical-twilight')
  })

  it('creates a higher-resolution full equirectangular grid without external APIs', () => {
    const cells = createLightingCells(new Date('2026-03-20T00:00:00.000Z'), -18)

    expect(cells).toHaveLength(16200)
    expect(cells[0]).toEqual(
      expect.objectContaining({
        x: 0,
        y: 0,
        width: 2,
        height: 2,
      }),
    )
  })
})
