import { describe, expect, it } from 'vitest'

import { localPlaceSearchProvider } from './localPlaceSearchProvider'

describe('localPlaceSearchProvider', () => {
  it('finds places by Korean and English text without external APIs', async () => {
    await expect(localPlaceSearchProvider.search('서울')).resolves.toEqual([
      expect.objectContaining({ id: 'kr-seoul', name: '서울' }),
    ])
    await expect(localPlaceSearchProvider.search('london')).resolves.toEqual([
      expect.objectContaining({ id: 'gb-london', name: '런던' }),
    ])
  })

  it('requires at least two characters', async () => {
    await expect(localPlaceSearchProvider.search('s')).resolves.toEqual([])
  })
})
