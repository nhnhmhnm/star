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

    if (url === '/sessions/visitors') {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            participantId: 'participant-1',
            displayName: '별친구',
            expiresAtUtcMs: Date.now() + 60_000,
          }),
      })
    }

    return Promise.resolve({ ok: false, json: () => Promise.resolve({}) })
  })
}

async function enterNickname() {
  const user = userEvent.setup()

  await user.type(screen.getByLabelText('닉네임'), '별친구')
  await user.click(screen.getByRole('button', { name: '밤하늘 지도 시작' }))
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

  it('requires a nickname before opening the world map', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: '별을 볼 때 사용할 닉네임' })).toBeInTheDocument()
    expect(screen.queryByLabelText('세계지도 영역')).not.toBeInTheDocument()
  })

  it('opens the world map after a valid nickname is submitted', async () => {
    render(<App />)

    await enterNickname()

    expect(
      await screen.findByRole('heading', { name: '밤인 지역을 선택해 하늘을 엽니다' }),
    ).toBeInTheDocument()
    expect(screen.getByText('별친구')).toBeInTheDocument()
  })

  it('renders the backend night threshold when public config loads', async () => {
    render(<App />)

    await enterNickname()

    expect(await screen.findByText('현재 기준: 태양 고도 -18° 이하')).toBeInTheDocument()
  })

  it('keeps users on the world map when the sky page has no selected location', async () => {
    window.history.pushState(null, '', '/sky')

    render(<App />)
    await enterNickname()

    await waitFor(() => {
      expect(window.location.pathname).toBe('/')
    })
    expect(
      screen.getByRole('heading', { name: '밤인 지역을 선택해 하늘을 엽니다' }),
    ).toBeInTheDocument()
  })

  it('restores a session from the same tab storage', async () => {
    window.sessionStorage.setItem(
      'real-time-sky.visitor-session',
      JSON.stringify({
        participantId: 'participant-1',
        displayName: '저장된별',
        expiresAtUtcMs: Date.now() + 60_000,
      }),
    )

    render(<App />)

    expect(
      await screen.findByRole('heading', { name: '밤인 지역을 선택해 하늘을 엽니다' }),
    ).toBeInTheDocument()
    expect(screen.getByText('저장된별')).toBeInTheDocument()
  })
})
