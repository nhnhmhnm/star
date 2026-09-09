import { useContext, type Dispatch } from 'react'

import { ObservationContext } from './ObservationContext'
import type { ObservationAction, ObservationState } from './observationState'

export function useObservationState(): ObservationState {
  return useObservationContext().state
}

export function useObservationDispatch(): Dispatch<ObservationAction> {
  return useObservationContext().dispatch
}

function useObservationContext() {
  const value = useContext(ObservationContext)

  if (!value) {
    throw new Error('ObservationProvider 안에서만 관측 상태를 사용할 수 있습니다.')
  }

  return value
}
