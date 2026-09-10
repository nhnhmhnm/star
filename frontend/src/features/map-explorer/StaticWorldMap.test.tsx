import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { StaticWorldMap } from './StaticWorldMap'

describe('StaticWorldMap', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders the token-free world map fallback', () => {
    render(<StaticWorldMap nightAltitudeThresholdDeg={-18} />)

    expect(screen.getByLabelText('세계지도 영역')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '확대' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '축소' })).toBeDisabled()
  })

  it('zooms and resets with accessible controls', async () => {
    const user = userEvent.setup()

    render(<StaticWorldMap />)

    await user.click(screen.getByRole('button', { name: '확대' }))

    expect(screen.getByText(/배율 1\.5x/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '축소' })).toBeEnabled()

    await user.click(screen.getByRole('button', { name: '초기화' }))

    expect(screen.getByText(/배율 1\.0x/)).toBeInTheDocument()
  })

  it('emits coordinates when the map is clicked without dragging', () => {
    const onCoordinateSelect = vi.fn()

    render(<StaticWorldMap onCoordinateSelect={onCoordinateSelect} />)

    const map = screen.getByLabelText('세계지도 영역')

    vi.spyOn(map, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 360,
      bottom: 180,
      width: 360,
      height: 180,
      toJSON: () => ({}),
    })
    fireEvent.pointerDown(map, { clientX: 180, clientY: 90, pointerId: 1 })
    fireEvent.pointerUp(map, { clientX: 180, clientY: 90, pointerId: 1 })

    expect(onCoordinateSelect).toHaveBeenCalledWith({ latitudeDeg: 0, longitudeDeg: 0 })
  })
})
