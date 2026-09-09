import { useMemo, useReducer, type ReactNode } from 'react'

import { ObservationContext } from './ObservationContext'
import { initialObservationState, observationReducer } from './observationState'

export function ObservationProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(observationReducer, initialObservationState)
  const value = useMemo(() => ({ state, dispatch }), [state])

  return <ObservationContext.Provider value={value}>{children}</ObservationContext.Provider>
}
