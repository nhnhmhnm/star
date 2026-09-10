export interface VisitorSession {
  participantId: string
  displayName: string
  expiresAtUtcMs: number
}

export interface NicknameValidationResult {
  displayName: string
  error: string | null
}

export const visitorSessionStorageKey = 'real-time-sky.visitor-session'

const nicknamePattern = /^[가-힣A-Za-z0-9 _-]{2,20}$/

export function validateNickname(value: string): NicknameValidationResult {
  const displayName = value.trim()

  if (!nicknamePattern.test(displayName)) {
    return {
      displayName,
      error: '닉네임은 2~20자의 한글, 영문, 숫자, 공백, 밑줄, 하이픈만 사용할 수 있습니다.',
    }
  }

  return { displayName, error: null }
}

export function readStoredVisitorSession(nowUtcMs: number = Date.now()): VisitorSession | null {
  const rawSession = window.sessionStorage.getItem(visitorSessionStorageKey)

  if (!rawSession) {
    return null
  }

  try {
    const parsed: unknown = JSON.parse(rawSession)

    if (!isVisitorSession(parsed) || parsed.expiresAtUtcMs <= nowUtcMs) {
      clearStoredVisitorSession()
      return null
    }

    return parsed
  } catch {
    clearStoredVisitorSession()
    return null
  }
}

export function storeVisitorSession(session: VisitorSession): void {
  window.sessionStorage.setItem(visitorSessionStorageKey, JSON.stringify(session))
}

export function clearStoredVisitorSession(): void {
  window.sessionStorage.removeItem(visitorSessionStorageKey)
}

function isVisitorSession(value: unknown): value is VisitorSession {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.participantId === 'string' &&
    typeof value.displayName === 'string' &&
    typeof value.expiresAtUtcMs === 'number' &&
    Number.isFinite(value.expiresAtUtcMs)
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
