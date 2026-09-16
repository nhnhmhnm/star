export interface GeographicCoordinates {
  latitudeDeg: number
  longitudeDeg: number
}

export interface NightEligibilityResult {
  isEligible: boolean
  solarAltitudeDeg: number
}

const degToRad = Math.PI / 180
const radToDeg = 180 / Math.PI
const millisecondsPerDay = 86_400_000
const unixEpochJulianDay = 2_440_587.5

export function getNightEligibility(
  coordinates: GeographicCoordinates,
  observedAt: Date,
  nightAltitudeThresholdDeg: number,
): NightEligibilityResult {
  assertValidCoordinates(coordinates)
  assertValidDate(observedAt)
  assertValidThreshold(nightAltitudeThresholdDeg)

  const solarAltitudeDeg = calculateSolarAltitudeDeg(coordinates, observedAt)

  return {
    isEligible: solarAltitudeDeg <= nightAltitudeThresholdDeg,
    solarAltitudeDeg,
  }
}

export function calculateSolarAltitudeDeg(
  { latitudeDeg, longitudeDeg }: GeographicCoordinates,
  observedAt: Date,
): number {
  assertValidCoordinates({ latitudeDeg, longitudeDeg })
  assertValidDate(observedAt)

  const { declinationRad, equationOfTimeMinutes, utcMinutes } = calculateSolarTerms(observedAt)
  const trueSolarTimeMinutes = normalizeMinutes(
    utcMinutes + equationOfTimeMinutes + 4 * longitudeDeg,
  )
  const hourAngleDeg =
    trueSolarTimeMinutes / 4 < 0 ? trueSolarTimeMinutes / 4 + 180 : trueSolarTimeMinutes / 4 - 180
  const latitudeRad = latitudeDeg * degToRad
  const cosineSolarZenith =
    Math.sin(latitudeRad) * Math.sin(declinationRad) +
    Math.cos(latitudeRad) * Math.cos(declinationRad) * Math.cos(hourAngleDeg * degToRad)
  const solarZenithRad = Math.acos(clamp(cosineSolarZenith, -1, 1))

  return 90 - solarZenithRad * radToDeg
}

export function calculateAntisolarCoordinate(observedAt: Date): GeographicCoordinates {
  assertValidDate(observedAt)

  const { declinationRad, equationOfTimeMinutes, utcMinutes } = calculateSolarTerms(observedAt)
  const subsolarLongitudeDeg = normalizeLongitudeDeg((720 - utcMinutes - equationOfTimeMinutes) / 4)

  return {
    latitudeDeg: -declinationRad * radToDeg,
    longitudeDeg: normalizeLongitudeDeg(subsolarLongitudeDeg + 180),
  }
}

function calculateSolarTerms(observedAt: Date) {
  // NOAA's compact solar position approximation is accurate enough for UX gating.
  // Backend config remains the authority for the altitude threshold itself.
  const julianDay = observedAt.getTime() / millisecondsPerDay + unixEpochJulianDay
  const julianCentury = (julianDay - 2_451_545) / 36_525
  const geometricMeanLongitude = normalizeDegrees(
    280.46646 + julianCentury * (36_000.76983 + julianCentury * 0.0003032),
  )
  const geometricMeanAnomaly =
    357.52911 + julianCentury * (35_999.05029 - 0.0001537 * julianCentury)
  const eccentricity = 0.016708634 - julianCentury * (0.000042037 + 0.0000001267 * julianCentury)
  const equationOfCenter =
    Math.sin(geometricMeanAnomaly * degToRad) *
      (1.914602 - julianCentury * (0.004817 + 0.000014 * julianCentury)) +
    Math.sin(2 * geometricMeanAnomaly * degToRad) * (0.019993 - 0.000101 * julianCentury) +
    Math.sin(3 * geometricMeanAnomaly * degToRad) * 0.000289
  const trueLongitude = geometricMeanLongitude + equationOfCenter
  const apparentLongitude =
    trueLongitude - 0.00569 - 0.00478 * Math.sin((125.04 - 1934.136 * julianCentury) * degToRad)
  const meanObliquity =
    23 +
    (26 +
      (21.448 - julianCentury * (46.815 + julianCentury * (0.00059 - 0.001813 * julianCentury))) /
        60) /
      60
  const correctedObliquity =
    meanObliquity + 0.00256 * Math.cos((125.04 - 1934.136 * julianCentury) * degToRad)
  const declinationRad = Math.asin(
    Math.sin(correctedObliquity * degToRad) * Math.sin(apparentLongitude * degToRad),
  )
  const variance = Math.tan((correctedObliquity / 2) * degToRad) ** 2
  const equationOfTimeMinutes =
    4 *
    radToDeg *
    (variance * Math.sin(2 * geometricMeanLongitude * degToRad) -
      2 * eccentricity * Math.sin(geometricMeanAnomaly * degToRad) +
      4 *
        eccentricity *
        variance *
        Math.sin(geometricMeanAnomaly * degToRad) *
        Math.cos(2 * geometricMeanLongitude * degToRad) -
      0.5 * variance ** 2 * Math.sin(4 * geometricMeanLongitude * degToRad) -
      1.25 * eccentricity ** 2 * Math.sin(2 * geometricMeanAnomaly * degToRad))
  const utcMinutes =
    observedAt.getUTCHours() * 60 +
    observedAt.getUTCMinutes() +
    observedAt.getUTCSeconds() / 60 +
    observedAt.getUTCMilliseconds() / 60_000

  return { declinationRad, equationOfTimeMinutes, utcMinutes }
}

function normalizeDegrees(value: number): number {
  return ((value % 360) + 360) % 360
}

function normalizeMinutes(value: number): number {
  return ((value % 1_440) + 1_440) % 1_440
}

function normalizeLongitudeDeg(value: number): number {
  return ((((value + 180) % 360) + 360) % 360) - 180
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum)
}

function assertValidCoordinates({ latitudeDeg, longitudeDeg }: GeographicCoordinates): void {
  if (!Number.isFinite(latitudeDeg) || latitudeDeg < -90 || latitudeDeg > 90) {
    throw new RangeError('위도는 -90도 이상 90도 이하이어야 합니다.')
  }

  if (!Number.isFinite(longitudeDeg) || longitudeDeg < -180 || longitudeDeg > 180) {
    throw new RangeError('경도는 -180도 이상 180도 이하이어야 합니다.')
  }
}

function assertValidDate(observedAt: Date): void {
  if (Number.isNaN(observedAt.getTime())) {
    throw new RangeError('관측 시각은 유효한 Date여야 합니다.')
  }
}

function assertValidThreshold(nightAltitudeThresholdDeg: number): void {
  if (
    !Number.isFinite(nightAltitudeThresholdDeg) ||
    nightAltitudeThresholdDeg < -90 ||
    nightAltitudeThresholdDeg > 0
  ) {
    throw new RangeError('밤하늘 진입 기준은 -90도 이상 0도 이하이어야 합니다.')
  }
}
