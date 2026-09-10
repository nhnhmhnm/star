export interface PublicAppConfig {
  nightAltitudeThresholdDeg: number
  presenceCellSizeDeg: number
  presenceHeartbeatSeconds: number
}

export class PublicConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PublicConfigError'
  }
}

export async function fetchPublicAppConfig(
  fetcher: typeof fetch = fetch,
): Promise<PublicAppConfig> {
  const response = await fetcher('/config/public')

  if (!response.ok) {
    throw new PublicConfigError('공개 설정을 불러오지 못했습니다.')
  }

  const payload: unknown = await response.json()
  return parsePublicAppConfig(payload)
}

export function parsePublicAppConfig(payload: unknown): PublicAppConfig {
  if (!isRecord(payload)) {
    throw new PublicConfigError('공개 설정 응답 형식이 올바르지 않습니다.')
  }

  const { nightAltitudeThresholdDeg, presenceCellSizeDeg, presenceHeartbeatSeconds } = payload

  if (
    !isNumberInRange(nightAltitudeThresholdDeg, -90, 0) ||
    !isNumberInRange(presenceCellSizeDeg, Number.MIN_VALUE, 5) ||
    !isNumberInRange(presenceHeartbeatSeconds, 5, 120)
  ) {
    throw new PublicConfigError('공개 설정 값이 올바르지 않습니다.')
  }

  return { nightAltitudeThresholdDeg, presenceCellSizeDeg, presenceHeartbeatSeconds }
}

function isNumberInRange(value: unknown, minimum: number, maximum: number): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= minimum && value <= maximum
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
