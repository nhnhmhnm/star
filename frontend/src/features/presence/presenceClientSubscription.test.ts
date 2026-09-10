import { describe, expect, it } from 'vitest'

import { parsePresenceSnapshot } from './presenceClient'

describe('parsePresenceSnapshot', () => {
  it('parses presence cells from websocket snapshots', () => {
    expect(
      parsePresenceSnapshot({
        type: 'snapshot',
        cells: [
          {
            cellId: '37.5000:127.0000',
            latitudeDeg: 37.5,
            longitudeDeg: 127,
            members: [{ participantId: 'participant-1', displayName: '별친구' }],
          },
        ],
      }),
    ).toEqual({
      type: 'snapshot',
      cells: [
        {
          cellId: '37.5000:127.0000',
          latitudeDeg: 37.5,
          longitudeDeg: 127,
          members: [{ participantId: 'participant-1', displayName: '별친구' }],
        },
      ],
    })
  })
})
