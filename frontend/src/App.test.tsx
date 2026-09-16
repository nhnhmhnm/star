import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import App from './App'

function mockBackend() {
  globalThis.fetch = vi.fn().mockImplementation((input: RequestInfo | URL) => {
    const url = input.toString()

    if (url === '/config/public') {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            nightAltitudeThresholdDeg: -18,
            presenceCellSizeDeg: 0.25,
            presenceHeartbeatSeconds: 20,
          }),
      })
    }

    return Promise.resolve({ ok: false, json: () => Promise.resolve({}) })
  })
}

describe('App', () => {
  beforeEach(() => {
    window.history.pushState(null, '', '/')
    window.sessionStorage.clear()
    mockBackend()
  })

  afterEach(() => {
    cleanup()
  })

  it('opens the landing page first', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: 'Real Time Sky' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /입장하기/ })).toHaveAttribute('href', '/map')
  })

  it('opens the world map from the landing page without requiring a nickname', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('link', { name: /입장하기/ }))

    expect(window.location.pathname).toBe('/map')
    await waitFor(() => {
      expect(document.querySelector('.leaflet-container')).toBeInTheDocument()
    })
  })

  it('does not create a visitor session on map entry', async () => {
    window.history.pushState(null, '', '/map')
    render(<App />)

    await waitFor(() => {
      expect(document.querySelector('.leaflet-container')).toBeInTheDocument()
    })

    expect(globalThis.fetch).not.toHaveBeenCalledWith(
      '/sessions/visitors',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('renders the backend night threshold in the map tip', async () => {
    window.history.pushState(null, '', '/map')
    render(<App />)

    await waitFor(() => {
      expect(screen.getAllByText((content) => content.includes('-18')).length).toBeGreaterThan(0)
    })
  })

  it('keeps users on the world map when the sky page has no selected location', async () => {
    window.history.pushState(null, '', '/sky')
    render(<App />)

    await waitFor(() => {
      expect(window.location.pathname).toBe('/map')
    })
    expect(document.querySelector('.leaflet-container')).toBeInTheDocument()
  })
})
