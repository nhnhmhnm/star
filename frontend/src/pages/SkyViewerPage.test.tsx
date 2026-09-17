import { describe, expect, it } from 'vitest'

import {
  getCardinalDirectionCode,
  getCompassDirectionWindow,
} from '../features/sky-engine/skyCompass'

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
