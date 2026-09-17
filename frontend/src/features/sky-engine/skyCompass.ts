import { normalizeAzimuthDeg } from './StellariumAdapter'

export type CardinalDirection = 'N' | 'E' | 'S' | 'W'

const compassDirectionOrder = ['E', 'S', 'W', 'N'] as const

export function getCardinalDirectionCode(azimuthDeg: number): CardinalDirection {
  const normalizedAzimuthDeg = normalizeAzimuthDeg(azimuthDeg)

  if (normalizedAzimuthDeg >= 315 || normalizedAzimuthDeg < 45) {
    return 'N'
  }

  if (normalizedAzimuthDeg < 135) {
    return 'E'
  }

  if (normalizedAzimuthDeg < 225) {
    return 'S'
  }

  return 'W'
}

export function getCompassDirectionWindow(azimuthDeg: number): readonly CardinalDirection[] {
  const activeDirection = getCardinalDirectionCode(azimuthDeg)
  const activeIndex = compassDirectionOrder.indexOf(activeDirection)

  return [
    compassDirectionOrder[(activeIndex + compassDirectionOrder.length - 1) % 4],
    activeDirection,
    compassDirectionOrder[(activeIndex + 1) % 4],
  ]
}
