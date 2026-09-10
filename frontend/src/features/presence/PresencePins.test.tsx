import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { PresencePins } from './PresencePins'

describe('PresencePins', () => {
  it('renders one grouped pin label for cells with multiple members', () => {
    render(
      <svg>
        <PresencePins
          cells={[
            {
              cellId: '37.5000:127.0000',
              latitudeDeg: 37.5,
              longitudeDeg: 127,
              members: [
                { participantId: '1', displayName: '별친구' },
                { participantId: '2', displayName: '달친구' },
              ],
            },
          ]}
        />
      </svg>,
    )

    expect(screen.getByText('2')).toBeInTheDocument()
  })
})
