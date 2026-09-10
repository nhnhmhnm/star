import { useState, type FormEvent } from 'react'

import styles from './PlaceSearchBox.module.css'
import type { PlaceSearchProvider, PlaceSearchResult } from './placeSearch'
import { usePlaceSearch } from './usePlaceSearch'

interface PlaceSearchBoxProps {
  provider: PlaceSearchProvider
  onResultSelect: (result: PlaceSearchResult) => void
}

export function PlaceSearchBox({ provider, onResultSelect }: PlaceSearchBoxProps) {
  const [query, setQuery] = useState('')
  const search = usePlaceSearch(provider)

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void search.search(query)
  }

  return (
    <form className={styles.searchBox} onSubmit={submit}>
      <label className={styles.label} htmlFor="place-search">
        장소 검색
      </label>
      <div className={styles.row}>
        <input
          id="place-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="서울, 런던, Sydney"
        />
        <button type="submit" disabled={search.isSearching || query.trim().length < 2}>
          {search.isSearching ? '검색 중' : '검색'}
        </button>
      </div>
      <p className={styles.help}>
        검색 결과는 지도 이동과 확대에만 사용하고 관측 위치는 확정하지 않습니다.
      </p>
      {search.error ? <p className={styles.error}>{search.error}</p> : null}
      {search.hasSearched && !search.isSearching && !search.error && search.results.length === 0 ? (
        <p className={styles.empty}>검색 결과가 없습니다.</p>
      ) : null}
      {search.results.length > 0 ? (
        <ul className={styles.results}>
          {search.results.map((result) => (
            <li key={result.id}>
              <button type="button" onClick={() => onResultSelect(result)}>
                <span>{result.name}</span>
                <small>{result.region}</small>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </form>
  )
}
