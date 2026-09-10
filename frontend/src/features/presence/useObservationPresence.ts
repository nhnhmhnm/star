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
  location: SelectedObservationLocation
  session: VisitorSession
  webSocketFactory?: typeof WebSocket
}

export function useObservationPresence({
  location,
  session,
  webSocketFactory = WebSocket,
}: UseObservationPresenceOptions): PresenceConnectionStatus {
  const [status, setStatus] = useState<PresenceConnectionStatus>('connecting')

  useEffect(() => {
    const socket = openPresenceConnection(session, location, webSocketFactory)
    const heartbeatId = createPresenceHeartbeat(socket)

    socket.addEventListener('open', () => setStatus('connected'))
    socket.addEventListener('close', () => setStatus('disconnected'))
    socket.addEventListener('error', () => setStatus('unavailable'))

    return () => {
      closePresenceConnection(socket, heartbeatId)
    }
  }, [location.id, session.participantId, session.displayName, webSocketFactory, location, session])

  return status
}
