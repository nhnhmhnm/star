export interface MapPoint {
  x: number
  y: number
}

export interface GeoCoordinate {
  latitudeDeg: number
  longitudeDeg: number
}

export interface ViewportPoint {
  clientX: number
  clientY: number
}

export interface ViewportRect {
  left: number
  top: number
  width: number
  height: number
}

export interface MapViewBox {
  x: number
  y: number
  width: number
  height: number
}

export const worldMapWidth = 360
export const worldMapHeight = 180
export const minMapZoom = 1
export const maxMapZoom = 8

export function clampLatitude(latitudeDeg: number): number {
  return clamp(latitudeDeg, -85, 85)
}

export function normalizeLongitude(longitudeDeg: number): number {
  const normalized = ((((longitudeDeg + 180) % 360) + 360) % 360) - 180

  return Object.is(normalized, -0) ? 0 : normalized
}

export function clampZoom(zoom: number): number {
  return clamp(zoom, minMapZoom, maxMapZoom)
}

// 정적 세계지도 fallback은 equirectangular 좌표계를 사용합니다.
// C12의 클릭 좌표 확정도 같은 경계 함수로 처리해 SDK별 좌표 순서 오류를 줄입니다.
export function geoCoordinateToMapPoint(coordinate: GeoCoordinate): MapPoint {
  return {
    x: normalizeLongitude(coordinate.longitudeDeg) + 180,
    y: 90 - clampLatitude(coordinate.latitudeDeg),
  }
}

export function mapPointToGeoCoordinate(point: MapPoint): GeoCoordinate {
  return {
    latitudeDeg: clampLatitude(90 - point.y),
    longitudeDeg: normalizeLongitude(point.x - 180),
  }
}

export function mapPointFromViewportPoint(
  point: ViewportPoint,
  rect: ViewportRect,
  viewBox: MapViewBox,
): MapPoint {
  return {
    x: viewBox.x + ((point.clientX - rect.left) / rect.width) * viewBox.width,
    y: viewBox.y + ((point.clientY - rect.top) / rect.height) * viewBox.height,
  }
}

export function clampMapCenter(center: GeoCoordinate, zoom: number): GeoCoordinate {
  const clampedZoom = clampZoom(zoom)
  const halfWidth = worldMapWidth / clampedZoom / 2
  const halfHeight = worldMapHeight / clampedZoom / 2
  const centerPoint = geoCoordinateToMapPoint(center)

  return mapPointToGeoCoordinate({
    x: clamp(centerPoint.x, halfWidth, worldMapWidth - halfWidth),
    y: clamp(centerPoint.y, halfHeight, worldMapHeight - halfHeight),
  })
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}
