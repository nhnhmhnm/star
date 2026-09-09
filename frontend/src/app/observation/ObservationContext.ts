import { createContext, type Dispatch } from 'react'

import type { ObservationAction, ObservationState } from './observationState'

export interface ObservationContextValue {
  state: ObservationState
  dispatch: Dispatch<ObservationAction>
}

export const ObservationContext = createContext<ObservationContextValue | null>(null)
