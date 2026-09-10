import { useEffect, useState } from 'react'

import {
  openPresenceSubscription,
  parsePresenceSnapshot,
  type PresenceCell,
} from './presenceClient'

export interface PresenceMapState {
  cells: PresenceCell[]
  status: 'connecting' | 'connected' | 'disconnected' | 'unavailable'
}

export function usePresenceMap(webSocketFactory: typeof WebSocket = WebSocket): PresenceMapState {
  const [state, setState] = useState<PresenceMapState>({
    cells: [],
    status: 'connecting',
  })

  useEffect(() => {
    const socket = openPresenceSubscription(webSocketFactory)

    socket.addEventListener('open', () => {
      setState((current) => ({ ...current, status: 'connected' }))
    })
    socket.addEventListener('message', (event: MessageEvent) => {
      const parsed = parsePresenceSnapshot(JSON.parse(String(event.data)))

      if (parsed) {
        setState({ cells: parsed.cells, status: 'connected' })
      }
    })
    socket.addEventListener('close', () => {
      setState((current) => ({ ...current, status: 'disconnected' }))
    })
    socket.addEventListener('error', () => {
      setState((current) => ({ ...current, status: 'unavailable' }))
    })

    return () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'leave' }))
      }

      if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
        socket.close()
      }
    }
  }, [webSocketFactory])

  return state
}
