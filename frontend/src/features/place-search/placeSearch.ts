import type { GeoCoordinate } from '../map-explorer/mapProjection'

export interface PlaceSearchResult {
  id: string
  name: string
  region: string
  coordinate: GeoCoordinate
  suggestedZoom: number
  keywords: string[]
}

export interface PlaceSearchProvider {
  search(query: string): Promise<PlaceSearchResult[]>
}

export function normalizeSearchText(value: string): string {
  return value.trim().toLocaleLowerCase()
}
