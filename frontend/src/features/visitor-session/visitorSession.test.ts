import { beforeEach, describe, expect, it } from 'vitest'

import {
  readStoredVisitorSession,
  storeVisitorSession,
  validateNickname,
  visitorSessionStorageKey,
  type VisitorSession,
} from './visitorSession'

const validSession: VisitorSession = {
  clientSessionId: 'client-1',
  participantId: 'participant-1',
  displayName: '별친구',
  expiresAtUtcMs: 2_000,
}

describe('validateNickname', () => {
  it('trims and accepts a valid nickname', () => {
    expect(validateNickname(' 별친구_1 ')).toEqual({
      displayName: '별친구_1',
      error: null,
    })
  })

  it('rejects unsafe or unsupported nicknames', () => {
    expect(validateNickname('<script>').error).not.toBeNull()
    expect(validateNickname('a').error).not.toBeNull()
    expect(validateNickname('a'.repeat(21)).error).not.toBeNull()
    expect(validateNickname('별\t친구').error).not.toBeNull()
  })
})

describe('visitor session storage', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
  })

  it('restores a stored session in the same tab', () => {
    storeVisitorSession(validSession)

    expect(readStoredVisitorSession(1_000)).toEqual(validSession)
  })

  it('clears expired sessions', () => {
    storeVisitorSession(validSession)

    expect(readStoredVisitorSession(3_000)).toBeNull()
    expect(window.sessionStorage.getItem(visitorSessionStorageKey)).toBeNull()
  })
})
