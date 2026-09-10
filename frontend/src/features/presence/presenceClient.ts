import type { SelectedObservationLocation } from '../../app/observation/observationState'
import type { VisitorSession } from '../visitor-session/visitorSession'

export interface PresenceCellCoordinate {
  latitudeDeg: number
  longitudeDeg: number
}

const presenceCellSizeDeg = 0.25
const presenceHeartbeatMs = 20_000

export function quantizePresenceCoordinate(
  location: Pick<SelectedObservationLocation, 'latitudeDeg' | 'longitudeDeg'>,
): PresenceCellCoordinate {
  return {
    latitudeDeg: quantize(location.latitudeDeg, presenceCellSizeDeg, -90, 90),
    longitudeDeg: quantize(
      normalizeLongitude(location.longitudeDeg),
      presenceCellSizeDeg,
      -180,
      180,
    ),
  }
}

export function openPresenceConnection(
  session: VisitorSession,
  location: SelectedObservationLocation,
  webSocketFactory: typeof WebSocket = WebSocket,
): WebSocket {
  const cell = quantizePresenceCoordinate(location)
  const socket = new webSocketFactory(createPresenceWebSocketUrl('/presence/ws'))

  socket.addEventListener('open', () => {
    socket.send(
      JSON.stringify({
        type: 'join',
        participantId: session.participantId,
        latitudeDeg: cell.latitudeDeg,
        longitudeDeg: cell.longitudeDeg,
      }),
    )
  })

  return socket
}

export function createPresenceHeartbeat(socket: WebSocket): number {
  return window.setInterval(() => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'heartbeat' }))
    }
  }, presenceHeartbeatMs)
}

export function closePresenceConnection(socket: WebSocket, heartbeatId: number | null): void {
  if (heartbeatId !== null) {
    window.clearInterval(heartbeatId)
  }

  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: 'leave' }))
  }

  if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
    socket.close()
  }
}

export function createPresenceWebSocketUrl(path: string): string {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'

  return `${protocol}//${window.location.host}${path}`
}

function quantize(value: number, cellSizeDeg: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(Math.round(value / cellSizeDeg) * cellSizeDeg, minimum), maximum)
}

function normalizeLongitude(longitudeDeg: number): number {
  const normalized = ((((longitudeDeg + 180) % 360) + 360) % 360) - 180

  return Object.is(normalized, -0) ? 0 : normalized
}
