import { useState } from 'react'

import { createVisitorSession } from './visitorSessionApi'
import {
  readStoredVisitorSession,
  storeVisitorSession,
  validateNickname,
  type VisitorSession,
} from './visitorSession'

export interface VisitorSessionState {
  session: VisitorSession | null
  isSubmitting: boolean
  error: string | null
}

export function useVisitorSession() {
  const [state, setState] = useState<VisitorSessionState>(() => ({
    session: readStoredVisitorSession(),
    isSubmitting: false,
    error: null,
  }))

  async function submitNickname(value: string): Promise<void> {
    const validation = validateNickname(value)

    if (validation.error) {
      setState((current) => ({ ...current, error: validation.error }))
      return
    }

    setState((current) => ({ ...current, isSubmitting: true, error: null }))

    try {
      const session = await createVisitorSession(validation.displayName)
      storeVisitorSession(session)
      setState({ session, isSubmitting: false, error: null })
    } catch (error) {
      setState((current) => ({
        ...current,
        isSubmitting: false,
        error:
          error instanceof Error
            ? error.message
            : '닉네임 세션을 만들지 못했습니다. 잠시 후 다시 시도해 주세요.',
      }))
    }
  }

  return {
    ...state,
    submitNickname,
  }
}
