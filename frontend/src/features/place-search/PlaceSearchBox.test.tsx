import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { localPlaceSearchProvider } from './localPlaceSearchProvider'
import { PlaceSearchBox } from './PlaceSearchBox'

describe('PlaceSearchBox', () => {
  afterEach(() => {
    cleanup()
  })

  it('submits a local search and selects a result', async () => {
    const user = userEvent.setup()
    const onResultSelect = vi.fn()

    render(<PlaceSearchBox provider={localPlaceSearchProvider} onResultSelect={onResultSelect} />)

    await user.type(screen.getByLabelText('장소 검색'), '서울')
    await user.click(screen.getByRole('button', { name: '검색' }))
    await user.click(await screen.findByRole('button', { name: /서울/ }))

    expect(onResultSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'kr-seoul' }))
  })
})
