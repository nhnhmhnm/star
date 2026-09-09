import { describe, expect, it, vi } from 'vitest'

import {
  createVisitorSession,
  parseVisitorSessionResponse,
  VisitorSessionError,
} from './visitorSessionApi'

describe('createVisitorSession', () => {
  it('creates a visitor session through the backend', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          participantId: 'participant-1',
          displayName: '별친구',
          expiresAtUtcMs: 2_000,
        }),
    })

    await expect(createVisitorSession('별친구', fetcher)).resolves.toMatchObject({
      participantId: 'participant-1',
      displayName: '별친구',
      expiresAtUtcMs: 2_000,
    })
    expect(fetcher).toHaveBeenCalledWith('/sessions/visitors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ displayName: '별친구' }),
    })
  })

  it('rejects invalid backend responses', () => {
    expect(() => parseVisitorSessionResponse({ displayName: '별친구' })).toThrow(
      VisitorSessionError,
    )
  })
})
