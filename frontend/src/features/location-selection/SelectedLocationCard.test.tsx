import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'

import type { SelectedObservationLocation } from '../../app/observation/observationState'
import { SelectedLocationCard } from './SelectedLocationCard'

const location: SelectedObservationLocation = {
  id: 'manual-0-0',
  label: '위도 0.00°, 경도 0.00°',
  latitudeDeg: 0,
  longitudeDeg: 0,
}

describe('SelectedLocationCard', () => {
  afterEach(() => {
    cleanup()
  })

  it('shows an empty selection state', () => {
    render(
      <SelectedLocationCard
        location={null}
        eligibility={null}
        configError={null}
        onClear={() => undefined}
      />,
    )

    expect(screen.getByRole('heading', { name: '선택된 위치 없음' })).toBeInTheDocument()
  })

  it('enables sky entry only when the selected coordinate is currently eligible', () => {
    render(
      <SelectedLocationCard
        location={location}
        eligibility={{ isEligible: true, solarAltitudeDeg: -30 }}
        configError={null}
        onClear={() => undefined}
      />,
    )

    expect(screen.getByText(/관측 가능/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '이 위치의 밤하늘 보기' })).toBeEnabled()
  })

  it('blocks sky entry when the selected coordinate is still bright', () => {
    render(
      <SelectedLocationCard
        location={location}
        eligibility={{ isEligible: false, solarAltitudeDeg: -8 }}
        configError={null}
        onClear={() => undefined}
      />,
    )

    expect(screen.getByText(/아직 밝음/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '이 위치의 밤하늘 보기' })).toBeDisabled()
  })

  it('clears the selected coordinate', async () => {
    const user = userEvent.setup()
    const calls: string[] = []

    render(
      <SelectedLocationCard
        location={location}
        eligibility={{ isEligible: false, solarAltitudeDeg: -8 }}
        configError={null}
        onClear={() => calls.push('clear')}
      />,
    )

    await user.click(screen.getByRole('button', { name: '선택 해제' }))

    expect(calls).toEqual(['clear'])
  })
})
