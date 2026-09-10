import { useRef, useState } from 'react'

import {
  normalizeSearchText,
  type PlaceSearchProvider,
  type PlaceSearchResult,
} from './placeSearch'

export interface PlaceSearchState {
  query: string
  results: PlaceSearchResult[]
  isSearching: boolean
  error: string | null
  hasSearched: boolean
}

export function usePlaceSearch(provider: PlaceSearchProvider) {
  const [state, setState] = useState<PlaceSearchState>({
    query: '',
    results: [],
    isSearching: false,
    error: null,
    hasSearched: false,
  })
  const requestId = useRef(0)

  async function search(query: string): Promise<void> {
    const normalizedQuery = normalizeSearchText(query)
    const nextRequestId = requestId.current + 1

    requestId.current = nextRequestId
    setState((currentState) => ({
      ...currentState,
      query,
      isSearching: true,
      error: null,
      hasSearched: true,
    }))

    try {
      const results = await provider.search(normalizedQuery)

      if (requestId.current !== nextRequestId) {
        return
      }

      setState({
        query,
        results,
        isSearching: false,
        error: null,
        hasSearched: true,
      })
    } catch {
      if (requestId.current !== nextRequestId) {
        return
      }

      setState({
        query,
        results: [],
        isSearching: false,
        error: '장소 검색을 완료하지 못했습니다.',
        hasSearched: true,
      })
    }
  }

  return {
    ...state,
    search,
  }
}
