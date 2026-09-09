import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import App from './App'

describe('App', () => {
  beforeEach(() => {
    window.history.pushState(null, '', '/')
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ nightAltitudeThresholdDeg: -18 }),
    })
  })

  afterEach(() => {
    cleanup()
  })

  it('renders the world map page by default', () => {
    render(<App />)

    expect(
      screen.getByRole('heading', { name: '밤인 지역을 선택해 하늘을 엽니다' }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('세계지도 영역')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: '밤하늘' })).not.toBeInTheDocument()
  })

  it('renders the backend night threshold when public config loads', async () => {
    render(<App />)

    expect(await screen.findByText('현재 기준: 태양 고도 -18° 이하')).toBeInTheDocument()
  })

  it('keeps users on the world map when the sky page has no selected location', async () => {
    window.history.pushState(null, '', '/sky')

    render(<App />)

    await waitFor(() => {
      expect(window.location.pathname).toBe('/')
    })
    expect(
      screen.getByRole('heading', { name: '밤인 지역을 선택해 하늘을 엽니다' }),
    ).toBeInTheDocument()
  })
})
