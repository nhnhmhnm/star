import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import App from './App'

describe('App', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ nightAltitudeThresholdDeg: -18 }),
    })
  })

  it('renders the project shell', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: 'Real Time Sky' })).toBeInTheDocument()
  })

  it('renders the backend night threshold when public config loads', async () => {
    render(<App />)

    expect(await screen.findByText('밤하늘 진입 기준: 태양 고도 -18° 이하')).toBeInTheDocument()
  })
})
