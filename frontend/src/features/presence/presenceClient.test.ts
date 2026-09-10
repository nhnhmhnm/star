import { describe, expect, it } from 'vitest'

import { createPresenceWebSocketUrl, quantizePresenceCoordinate } from './presenceClient'

describe('presenceClient', () => {
  it('quantizes exact observation coordinates before presence sharing', () => {
    expect(quantizePresenceCoordinate({ latitudeDeg: 37.5665, longitudeDeg: 126.978 })).toEqual({
      latitudeDeg: 37.5,
      longitudeDeg: 127,
    })
  })

  it('uses the current host for websocket URLs', () => {
    expect(createPresenceWebSocketUrl('/presence/ws')).toBe(
      `ws://${window.location.host}/presence/ws`,
    )
  })
})
