import { cleanup, render, screen, waitFor } from '@testing-library/react'
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

  it('opens the world map without requiring a nickname', async () => {
    render(<App />)

    expect(await screen.findByLabelText('세계지도')).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: '별을 볼 때 사용할 닉네임' }),
    ).not.toBeInTheDocument()
  })

  it('does not create a visitor session on entry', async () => {
    render(<App />)

    await screen.findByLabelText('세계지도')

    expect(globalThis.fetch).not.toHaveBeenCalledWith(
      '/sessions/visitors',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('renders the backend night threshold in the map tip', async () => {
    render(<App />)

    expect(await screen.findByText('현재 기준: 태양 고도 -18° 이하')).toBeInTheDocument()
  })

  it('keeps users on the world map when the sky page has no selected location', async () => {
    window.history.pushState(null, '', '/sky')

    render(<App />)

    await waitFor(() => {
      expect(window.location.pathname).toBe('/')
    })
    expect(screen.getByLabelText('세계지도')).toBeInTheDocument()
  })
})
