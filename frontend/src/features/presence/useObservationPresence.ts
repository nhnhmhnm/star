import { useEffect, useState } from 'react'

import type { SelectedObservationLocation } from '../../app/observation/observationState'
import type { VisitorSession } from '../visitor-session/visitorSession'
import {
  closePresenceConnection,
  createPresenceHeartbeat,
  openPresenceConnection,
} from './presenceClient'

export type PresenceConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'unavailable'

interface UseObservationPresenceOptions {
  cellSizeDeg: number
  heartbeatSeconds: number
  location: SelectedObservationLocation
  session: VisitorSession
  webSocketFactory?: typeof WebSocket
}

export function useObservationPresence({
  cellSizeDeg,
  heartbeatSeconds,
  location,
  session,
  webSocketFactory = WebSocket,
}: UseObservationPresenceOptions): PresenceConnectionStatus {
  const [status, setStatus] = useState<PresenceConnectionStatus>('connecting')

  useEffect(() => {
    const socket = openPresenceConnection(session, location, cellSizeDeg, webSocketFactory)
    const heartbeatId = createPresenceHeartbeat(socket, heartbeatSeconds)

    socket.addEventListener('open', () => setStatus('connected'))
    socket.addEventListener('close', () => setStatus('disconnected'))
    socket.addEventListener('error', () => setStatus('unavailable'))

    return () => {
      closePresenceConnection(socket, heartbeatId)
    }
  }, [cellSizeDeg, heartbeatSeconds, location, session, webSocketFactory])

  return status
}
