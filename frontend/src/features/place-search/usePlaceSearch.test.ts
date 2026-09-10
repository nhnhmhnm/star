import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { PlaceSearchProvider } from './placeSearch'
import { usePlaceSearch } from './usePlaceSearch'

describe('usePlaceSearch', () => {
  it('keeps the newest search response when older responses arrive later', async () => {
    let resolveFirst: (() => void) | null = null
    const provider: PlaceSearchProvider = {
      search(query) {
        if (query === 'first') {
          return new Promise((resolve) => {
            resolveFirst = () =>
              resolve([
                {
                  id: 'old',
                  name: 'Old',
                  region: 'Test',
                  coordinate: { latitudeDeg: 0, longitudeDeg: 0 },
                  suggestedZoom: 2,
                  keywords: [],
                },
              ])
          })
        }

        return Promise.resolve([
          {
            id: 'new',
            name: 'New',
            region: 'Test',
            coordinate: { latitudeDeg: 1, longitudeDeg: 1 },
            suggestedZoom: 3,
            keywords: [],
          },
        ])
      },
    }
    const { result } = renderHook(() => usePlaceSearch(provider))

    void act(() => {
      void result.current.search('first')
    })
    await act(async () => {
      await result.current.search('second')
    })
    await act(async () => {
      resolveFirst?.()
    })

    expect(result.current.results).toEqual([expect.objectContaining({ id: 'new' })])
  })
})
