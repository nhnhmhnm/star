import {
  calculateAntisolarCoordinate,
  calculateSolarAltitudeDeg,
  type GeographicCoordinates,
} from '../night-eligibility/nightEligibility'

export type MapLightingBand =
  'day' | 'civil-twilight' | 'nautical-twilight' | 'astronomical-twilight' | 'night'

export interface LightingCell {
  id: string
  x: number
  y: number
  width: number
  height: number
  band: MapLightingBand
}

const longitudeStepDeg = 1
const latitudeStepDeg = 1
const degToRad = Math.PI / 180
const radToDeg = 180 / Math.PI

export interface NightBoundaryPoint extends GeographicCoordinates {}

export function getMapLightingBand(
  solarAltitudeDeg: number,
  nightAltitudeThresholdDeg: number,
): MapLightingBand {
  if (solarAltitudeDeg <= nightAltitudeThresholdDeg) {
    return 'night'
  }

  if (solarAltitudeDeg < -12) {
    return 'astronomical-twilight'
  }

  if (solarAltitudeDeg < -6) {
    return 'nautical-twilight'
  }

  if (solarAltitudeDeg < 0) {
    return 'civil-twilight'
  }

  return 'day'
}

export function createLightingCells(
  observedAt: Date,
  nightAltitudeThresholdDeg: number,
): LightingCell[] {
  const cells: LightingCell[] = []

  for (let latitudeNorth = 90; latitudeNorth > -90; latitudeNorth -= latitudeStepDeg) {
    for (let longitudeWest = -180; longitudeWest < 180; longitudeWest += longitudeStepDeg) {
      const centerLatitude = latitudeNorth - latitudeStepDeg / 2
      const centerLongitude = longitudeWest + longitudeStepDeg / 2
      const solarAltitudeDeg = calculateSolarAltitudeDeg(
        { latitudeDeg: centerLatitude, longitudeDeg: centerLongitude },
        observedAt,
      )

      cells.push({
        id: `${latitudeNorth}:${longitudeWest}`,
        x: longitudeWest + 180,
        y: 90 - latitudeNorth,
        width: longitudeStepDeg,
        height: latitudeStepDeg,
        band: getMapLightingBand(solarAltitudeDeg, nightAltitudeThresholdDeg),
      })
    }
  }

  return cells
}

export function getDarknessCenter(observedAt: Date): GeographicCoordinates {
  return calculateAntisolarCoordinate(observedAt)
}

export function createNightBoundary(
  observedAt: Date,
  nightAltitudeThresholdDeg: number,
  segmentCount = 360,
): NightBoundaryPoint[] {
  if (segmentCount < 36 || !Number.isInteger(segmentCount)) {
    throw new RangeError('Night boundary segment count must be an integer of at least 36.')
  }

  const center = getDarknessCenter(observedAt)
  const centerLatitudeRad = center.latitudeDeg * degToRad
  const centerLongitudeRad = center.longitudeDeg * degToRad
  const angularRadiusRad = (90 + nightAltitudeThresholdDeg) * degToRad

  return Array.from({ length: segmentCount }, (_, index) => {
    const bearingRad = (index / segmentCount) * Math.PI * 2
    const latitudeRad = Math.asin(
      Math.sin(centerLatitudeRad) * Math.cos(angularRadiusRad) +
        Math.cos(centerLatitudeRad) * Math.sin(angularRadiusRad) * Math.cos(bearingRad),
    )
    const longitudeRad =
      centerLongitudeRad +
      Math.atan2(
        Math.sin(bearingRad) * Math.sin(angularRadiusRad) * Math.cos(centerLatitudeRad),
        Math.cos(angularRadiusRad) - Math.sin(centerLatitudeRad) * Math.sin(latitudeRad),
      )

    return {
      latitudeDeg: latitudeRad * radToDeg,
      longitudeDeg: normalizeLongitude(longitudeRad * radToDeg),
    }
  })
}

function normalizeLongitude(longitudeDeg: number): number {
  return ((((longitudeDeg + 180) % 360) + 360) % 360) - 180
}
