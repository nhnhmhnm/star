import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'

import { StaticWorldMap } from './StaticWorldMap'

describe('StaticWorldMap', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders the token-free world map fallback', () => {
    render(<StaticWorldMap />)

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
})
