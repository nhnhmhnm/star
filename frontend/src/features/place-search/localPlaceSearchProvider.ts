import {
  normalizeSearchText,
  type PlaceSearchProvider,
  type PlaceSearchResult,
} from './placeSearch'

const localPlaces: PlaceSearchResult[] = [
  {
    id: 'kr-seoul',
    name: '서울',
    region: '대한민국',
    localizedName: { ko: '서울', en: 'Seoul' },
    localizedRegion: { ko: '대한민국', en: 'South Korea' },
    coordinate: { latitudeDeg: 37.5665, longitudeDeg: 126.978 },
    suggestedZoom: 5,
    keywords: ['seoul', '서울', '대한민국', 'south korea', 'korea'],
  },
  {
    id: 'kr-busan',
    name: '부산',
    region: '대한민국',
    localizedName: { ko: '부산', en: 'Busan' },
    localizedRegion: { ko: '대한민국', en: 'South Korea' },
    coordinate: { latitudeDeg: 35.1796, longitudeDeg: 129.0756 },
    suggestedZoom: 5,
    keywords: ['busan', '부산', '대한민국', 'south korea', 'korea'],
  },
  {
    id: 'jp-tokyo',
    name: '도쿄',
    region: '일본',
    localizedName: { ko: '도쿄', en: 'Tokyo' },
    localizedRegion: { ko: '일본', en: 'Japan' },
    coordinate: { latitudeDeg: 35.6762, longitudeDeg: 139.6503 },
    suggestedZoom: 5,
    keywords: ['tokyo', '도쿄', '일본', 'japan'],
  },
  {
    id: 'us-new-york',
    name: '뉴욕',
    region: '미국',
    localizedName: { ko: '뉴욕', en: 'New York' },
    localizedRegion: { ko: '미국', en: 'United States' },
    coordinate: { latitudeDeg: 40.7128, longitudeDeg: -74.006 },
    suggestedZoom: 5,
    keywords: ['new york', 'nyc', '뉴욕', '미국', 'united states', 'usa'],
  },
  {
    id: 'gb-london',
    name: '런던',
    region: '영국',
    localizedName: { ko: '런던', en: 'London' },
    localizedRegion: { ko: '영국', en: 'United Kingdom' },
    coordinate: { latitudeDeg: 51.5072, longitudeDeg: -0.1276 },
    suggestedZoom: 5,
    keywords: ['london', '런던', '영국', 'united kingdom', 'uk'],
  },
  {
    id: 'fr-paris',
    name: '파리',
    region: '프랑스',
    localizedName: { ko: '파리', en: 'Paris' },
    localizedRegion: { ko: '프랑스', en: 'France' },
    coordinate: { latitudeDeg: 48.8566, longitudeDeg: 2.3522 },
    suggestedZoom: 5,
    keywords: ['paris', '파리', '프랑스', 'france'],
  },
  {
    id: 'is-reykjavik',
    name: '레이캬비크',
    region: '아이슬란드',
    localizedName: { ko: '레이캬비크', en: 'Reykjavik' },
    localizedRegion: { ko: '아이슬란드', en: 'Iceland' },
    coordinate: { latitudeDeg: 64.1466, longitudeDeg: -21.9426 },
    suggestedZoom: 5,
    keywords: ['reykjavik', '레이캬비크', '아이슬란드', 'iceland'],
  },
  {
    id: 'au-sydney',
    name: '시드니',
    region: '호주',
    localizedName: { ko: '시드니', en: 'Sydney' },
    localizedRegion: { ko: '호주', en: 'Australia' },
    coordinate: { latitudeDeg: -33.8688, longitudeDeg: 151.2093 },
    suggestedZoom: 5,
    keywords: ['sydney', '시드니', '호주', 'australia'],
  },
  {
    id: 'br-sao-paulo',
    name: '상파울루',
    region: '브라질',
    localizedName: { ko: '상파울루', en: 'São Paulo' },
    localizedRegion: { ko: '브라질', en: 'Brazil' },
    coordinate: { latitudeDeg: -23.5558, longitudeDeg: -46.6396 },
    suggestedZoom: 5,
    keywords: ['sao paulo', 'são paulo', '상파울루', '브라질', 'brazil'],
  },
  {
    id: 'za-cape-town',
    name: '케이프타운',
    region: '남아프리카공화국',
    localizedName: { ko: '케이프타운', en: 'Cape Town' },
    localizedRegion: { ko: '남아프리카공화국', en: 'South Africa' },
    coordinate: { latitudeDeg: -33.9249, longitudeDeg: 18.4241 },
    suggestedZoom: 5,
    keywords: ['cape town', '케이프타운', '남아공', '남아프리카공화국', 'south africa'],
  },
]

export const localPlaceSearchProvider: PlaceSearchProvider = {
  async search(query: string) {
    const normalizedQuery = normalizeSearchText(query)

    if (normalizedQuery.length < 2) {
      return []
    }

    return localPlaces
      .filter((place) =>
        [
          place.name,
          place.region,
          place.localizedName?.ko,
          place.localizedName?.en,
          place.localizedRegion?.ko,
          place.localizedRegion?.en,
          ...place.keywords,
        ].some((value) => value && normalizeSearchText(value).includes(normalizedQuery)),
      )
      .slice(0, 5)
  },
}

export { localPlaces }
