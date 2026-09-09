export interface SelectedObservationLocation {
  id: string
  label: string
  latitudeDeg: number
  longitudeDeg: number
}

export interface ObservationState {
  selectedLocation: SelectedObservationLocation | null
}

export type ObservationAction =
  { type: 'selectLocation'; location: SelectedObservationLocation } | { type: 'clearLocation' }

export const initialObservationState: ObservationState = {
  selectedLocation: null,
}

export function observationReducer(
  state: ObservationState,
  action: ObservationAction,
): ObservationState {
  switch (action.type) {
    case 'selectLocation':
      return { ...state, selectedLocation: action.location }
    case 'clearLocation':
      return { ...state, selectedLocation: null }
  }
}
