import { describe, expect, it } from 'vitest'

import { normalizeAzimuthDeg } from './StellariumAdapter'

describe('normalizeAzimuthDeg', () => {
  it('keeps sky direction labels within one compass rotation', () => {
    expect(normalizeAzimuthDeg(0)).toBe(0)
    expect(normalizeAzimuthDeg(45)).toBe(45)
    expect(normalizeAzimuthDeg(360)).toBe(0)
    expect(normalizeAzimuthDeg(405)).toBe(45)
    expect(normalizeAzimuthDeg(-90)).toBe(270)
  })
})
