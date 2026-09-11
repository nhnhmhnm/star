import type { GeoCoordinate } from '../map-explorer/mapProjection'

export interface PlaceSearchResult {
  id: string
  name: string
  region: string
  localizedName?: LocalizedPlaceText
  localizedRegion?: LocalizedPlaceText
  coordinate: GeoCoordinate
  suggestedZoom: number
  keywords: string[]
}

export type PlaceDisplayLanguage = 'ko' | 'en'

export interface LocalizedPlaceText {
  ko: string
  en: string
}

export interface PlaceSearchProvider {
  search(query: string): Promise<PlaceSearchResult[]>
}

export function normalizeSearchText(value: string): string {
  return value.trim().toLocaleLowerCase()
}
