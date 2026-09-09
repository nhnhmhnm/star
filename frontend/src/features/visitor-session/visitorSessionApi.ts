import { createClientSessionId, type VisitorSession } from './visitorSession'

interface VisitorSessionResponse {
  participantId: string
  displayName: string
  expiresAtUtcMs: number
}

export class VisitorSessionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'VisitorSessionError'
  }
}

export async function createVisitorSession(
  displayName: string,
  fetcher: typeof fetch = fetch,
): Promise<VisitorSession> {
  const response = await fetcher('/sessions/visitors', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ displayName }),
  })

  if (!response.ok) {
    throw new VisitorSessionError('닉네임 세션을 만들지 못했습니다. 잠시 후 다시 시도해 주세요.')
  }

  const payload: unknown = await response.json()
  const sessionResponse = parseVisitorSessionResponse(payload)

  return {
    clientSessionId: createClientSessionId(),
    ...sessionResponse,
  }
}

export function parseVisitorSessionResponse(payload: unknown): VisitorSessionResponse {
  if (!isRecord(payload)) {
    throw new VisitorSessionError('닉네임 세션 응답 형식이 올바르지 않습니다.')
  }

  const { participantId, displayName, expiresAtUtcMs } = payload

  if (
    typeof participantId !== 'string' ||
    typeof displayName !== 'string' ||
    typeof expiresAtUtcMs !== 'number' ||
    !Number.isFinite(expiresAtUtcMs)
  ) {
    throw new VisitorSessionError('닉네임 세션 응답 형식이 올바르지 않습니다.')
  }

  return { participantId, displayName, expiresAtUtcMs }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
