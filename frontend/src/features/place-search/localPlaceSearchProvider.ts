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
    coordinate: { latitudeDeg: 37.5665, longitudeDeg: 126.978 },
    suggestedZoom: 5,
    keywords: ['seoul', '서울', '대한민국', 'korea'],
  },
  {
    id: 'kr-busan',
    name: '부산',
    region: '대한민국',
    coordinate: { latitudeDeg: 35.1796, longitudeDeg: 129.0756 },
    suggestedZoom: 5,
    keywords: ['busan', '부산', '대한민국', 'korea'],
  },
  {
    id: 'jp-tokyo',
    name: '도쿄',
    region: '일본',
    coordinate: { latitudeDeg: 35.6762, longitudeDeg: 139.6503 },
    suggestedZoom: 5,
    keywords: ['tokyo', '도쿄', '일본', 'japan'],
  },
  {
    id: 'us-new-york',
    name: '뉴욕',
    region: '미국',
    coordinate: { latitudeDeg: 40.7128, longitudeDeg: -74.006 },
    suggestedZoom: 5,
    keywords: ['new york', 'nyc', '뉴욕', '미국', 'usa'],
  },
  {
    id: 'gb-london',
    name: '런던',
    region: '영국',
    coordinate: { latitudeDeg: 51.5072, longitudeDeg: -0.1276 },
    suggestedZoom: 5,
    keywords: ['london', '런던', '영국', 'uk'],
  },
  {
    id: 'fr-paris',
    name: '파리',
    region: '프랑스',
    coordinate: { latitudeDeg: 48.8566, longitudeDeg: 2.3522 },
    suggestedZoom: 5,
    keywords: ['paris', '파리', '프랑스', 'france'],
  },
  {
    id: 'is-reykjavik',
    name: '레이캬비크',
    region: '아이슬란드',
    coordinate: { latitudeDeg: 64.1466, longitudeDeg: -21.9426 },
    suggestedZoom: 5,
    keywords: ['reykjavik', '레이캬비크', '아이슬란드', 'iceland'],
  },
  {
    id: 'au-sydney',
    name: '시드니',
    region: '호주',
    coordinate: { latitudeDeg: -33.8688, longitudeDeg: 151.2093 },
    suggestedZoom: 5,
    keywords: ['sydney', '시드니', '호주', 'australia'],
  },
  {
    id: 'br-sao-paulo',
    name: '상파울루',
    region: '브라질',
    coordinate: { latitudeDeg: -23.5558, longitudeDeg: -46.6396 },
    suggestedZoom: 5,
    keywords: ['sao paulo', 'são paulo', '상파울루', '브라질', 'brazil'],
  },
  {
    id: 'za-cape-town',
    name: '케이프타운',
    region: '남아프리카공화국',
    coordinate: { latitudeDeg: -33.9249, longitudeDeg: 18.4241 },
    suggestedZoom: 5,
    keywords: ['cape town', '케이프타운', '남아공', 'south africa'],
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
        [place.name, place.region, ...place.keywords].some((value) =>
          normalizeSearchText(value).includes(normalizedQuery),
        ),
      )
      .slice(0, 5)
  },
}

export { localPlaces }
