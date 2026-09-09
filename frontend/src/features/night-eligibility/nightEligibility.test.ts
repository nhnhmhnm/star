import { describe, expect, it } from 'vitest'

import { getNightEligibility } from './nightEligibility'

describe('getNightEligibility', () => {
  it('allows a location when the sun is below the configured threshold', () => {
    const result = getNightEligibility(
      { latitudeDeg: 0, longitudeDeg: 0 },
      new Date('2026-03-20T00:00:00.000Z'),
      -18,
    )

    expect(result.isEligible).toBe(true)
    expect(result.solarAltitudeDeg).toBeLessThan(-80)
  })

  it('blocks a location when the sun is above the configured threshold', () => {
    const result = getNightEligibility(
      { latitudeDeg: 0, longitudeDeg: 0 },
      new Date('2026-03-20T12:00:00.000Z'),
      -18,
    )

    expect(result.isEligible).toBe(false)
    expect(result.solarAltitudeDeg).toBeGreaterThan(80)
  })

  it('accepts coordinates on the international date line', () => {
    const east = getNightEligibility(
      { latitudeDeg: 0, longitudeDeg: 180 },
      new Date('2026-03-20T00:00:00.000Z'),
      -18,
    )
    const west = getNightEligibility(
      { latitudeDeg: 0, longitudeDeg: -180 },
      new Date('2026-03-20T00:00:00.000Z'),
      -18,
    )

    expect(Math.abs(east.solarAltitudeDeg - west.solarAltitudeDeg)).toBeLessThan(0.1)
  })

  it('rejects coordinates outside map bounds', () => {
    expect(() =>
      getNightEligibility(
        { latitudeDeg: 91, longitudeDeg: 0 },
        new Date('2026-03-20T00:00:00.000Z'),
        -18,
      ),
    ).toThrow(RangeError)
  })
})
