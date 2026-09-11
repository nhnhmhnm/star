import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { StaticWorldMap } from './StaticWorldMap'
import { getMinimumNonWrappingZoom } from './mapZoom'

describe('StaticWorldMap', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders the token-free Leaflet world map', () => {
    render(<StaticWorldMap nightAltitudeThresholdDeg={-18} />)

    expect(screen.getByLabelText('세계지도 영역')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '확대' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '축소' })).toBeDisabled()
  })

  it('provides accessible map controls', () => {
    render(<StaticWorldMap />)

    expect(screen.getByRole('button', { name: '확대' })).toBeEnabled()
    expect(screen.getByRole('button', { name: '축소' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '초기화' })).toBeEnabled()
  })

  it('raises the minimum zoom enough to avoid repeated continents on wide maps', () => {
    expect(getMinimumNonWrappingZoom(320)).toBe(1)
    expect(getMinimumNonWrappingZoom(1420)).toBe(3)
  })

  it('renders selected and presence markers on the Leaflet overlay', () => {
    render(
      <StaticWorldMap
        selectedCoordinate={{ latitudeDeg: 37.5665, longitudeDeg: 126.978 }}
        presenceCells={[
          {
            cellId: 'seoul',
            latitudeDeg: 37.5,
            longitudeDeg: 127,
            members: [
              { participantId: '1', displayName: '별친구' },
              { participantId: '2', displayName: '밤친구' },
            ],
          },
        ]}
      />,
    )

    expect(screen.getByText('2')).toBeInTheDocument()
  })
})
