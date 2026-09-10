import { calculateSolarAltitudeDeg } from '../night-eligibility/nightEligibility'

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

const longitudeStepDeg = 10
const latitudeStepDeg = 10

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
