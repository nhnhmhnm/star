export interface PublicAppConfig {
  nightAltitudeThresholdDeg: number
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

  const { nightAltitudeThresholdDeg } = payload

  if (
    typeof nightAltitudeThresholdDeg !== 'number' ||
    !Number.isFinite(nightAltitudeThresholdDeg) ||
    nightAltitudeThresholdDeg < -90 ||
    nightAltitudeThresholdDeg > 0
  ) {
    throw new PublicConfigError('밤하늘 진입 기준값이 올바르지 않습니다.')
  }

  return { nightAltitudeThresholdDeg }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
