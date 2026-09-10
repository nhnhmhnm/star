import type { SelectedObservationLocation } from '../../app/observation/observationState'
import type { VisitorSession } from '../visitor-session/visitorSession'

export interface PresenceCellCoordinate {
  latitudeDeg: number
  longitudeDeg: number
}

export interface PresenceMember {
  participantId: string
  displayName: string
}

export interface PresenceCell {
  cellId: string
  latitudeDeg: number
  longitudeDeg: number
  members: PresenceMember[]
}

export interface PresenceSnapshot {
  type: 'snapshot'
  cells: PresenceCell[]
}

export function quantizePresenceCoordinate(
  location: Pick<SelectedObservationLocation, 'latitudeDeg' | 'longitudeDeg'>,
  cellSizeDeg: number,
): PresenceCellCoordinate {
  return {
    latitudeDeg: quantize(location.latitudeDeg, cellSizeDeg, -90, 90),
    longitudeDeg: quantize(normalizeLongitude(location.longitudeDeg), cellSizeDeg, -180, 180),
  }
}

export function openPresenceConnection(
  session: VisitorSession,
  location: SelectedObservationLocation,
  cellSizeDeg: number,
  webSocketFactory: typeof WebSocket = WebSocket,
): WebSocket {
  const cell = quantizePresenceCoordinate(location, cellSizeDeg)
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

export function openPresenceSubscription(
  webSocketFactory: typeof WebSocket = WebSocket,
): WebSocket {
  const socket = new webSocketFactory(createPresenceWebSocketUrl('/presence/ws'))

  socket.addEventListener('open', () => {
    socket.send(JSON.stringify({ type: 'subscribe' }))
  })

  return socket
}

export function parsePresenceSnapshot(value: unknown): PresenceSnapshot | null {
  if (!isRecord(value) || value.type !== 'snapshot' || !Array.isArray(value.cells)) {
    return null
  }

  const cells = value.cells.flatMap((cell): PresenceCell[] => {
    if (
      !isRecord(cell) ||
      typeof cell.cellId !== 'string' ||
      typeof cell.latitudeDeg !== 'number' ||
      typeof cell.longitudeDeg !== 'number' ||
      !Array.isArray(cell.members)
    ) {
      return []
    }

    return [
      {
        cellId: cell.cellId,
        latitudeDeg: cell.latitudeDeg,
        longitudeDeg: cell.longitudeDeg,
        members: cell.members.flatMap((member): PresenceMember[] => {
          if (
            !isRecord(member) ||
            typeof member.participantId !== 'string' ||
            typeof member.displayName !== 'string'
          ) {
            return []
          }

          return [
            {
              participantId: member.participantId,
              displayName: member.displayName,
            },
          ]
        }),
      },
    ]
  })

  return { type: 'snapshot', cells }
}

export function createPresenceHeartbeat(socket: WebSocket, heartbeatSeconds: number): number {
  return window.setInterval(() => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'heartbeat' }))
    }
  }, heartbeatSeconds * 1000)
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
