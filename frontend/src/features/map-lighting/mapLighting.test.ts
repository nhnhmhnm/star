import { describe, expect, it } from 'vitest'

import {
  createLightingCells,
  createNightBoundary,
  getDarknessCenter,
  getMapLightingBand,
} from './mapLighting'
import { calculateSolarAltitudeDeg } from '../night-eligibility/nightEligibility'

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

    expect(cells).toHaveLength(64800)
    expect(cells[0]).toEqual(
      expect.objectContaining({
        x: 0,
        y: 0,
        width: 1,
        height: 1,
      }),
    )
  })

  it('centers the night region on the point opposite the sun', () => {
    const observedAt = new Date('2026-03-20T12:00:00.000Z')
    const center = getDarknessCenter(observedAt)

    expect(calculateSolarAltitudeDeg(center, observedAt)).toBeCloseTo(-90, 6)
  })

  it('creates a smooth boundary at the configured solar altitude', () => {
    const observedAt = new Date('2026-09-16T03:00:00.000Z')
    const boundary = createNightBoundary(observedAt, -18)

    expect(boundary).toHaveLength(360)
    boundary
      .filter((_, index) => index % 45 === 0)
      .forEach((point) => {
        expect(calculateSolarAltitudeDeg(point, observedAt)).toBeCloseTo(-18, 6)
      })
  })
})
