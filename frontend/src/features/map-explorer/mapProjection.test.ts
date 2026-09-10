import { describe, expect, it } from 'vitest'

import {
  clampMapCenter,
  clampZoom,
  geoCoordinateToMapPoint,
  mapPointToGeoCoordinate,
  mapPointFromViewportPoint,
  maxMapZoom,
  minMapZoom,
  normalizeLongitude,
} from './mapProjection'

describe('mapProjection', () => {
  it('converts longitude and latitude to static map points', () => {
    expect(geoCoordinateToMapPoint({ latitudeDeg: 0, longitudeDeg: 0 })).toEqual({ x: 180, y: 90 })
    expect(geoCoordinateToMapPoint({ latitudeDeg: 45, longitudeDeg: 90 })).toEqual({
      x: 270,
      y: 45,
    })
  })

  it('normalizes longitude into the world map range', () => {
    expect(normalizeLongitude(181)).toBe(-179)
    expect(normalizeLongitude(-181)).toBe(179)
    expect(normalizeLongitude(360)).toBe(0)
  })

  it('converts map points back to app coordinates', () => {
    expect(mapPointToGeoCoordinate({ x: 180, y: 90 })).toEqual({
      latitudeDeg: 0,
      longitudeDeg: 0,
    })
  })

  it('keeps zoom and center inside the visible static map bounds', () => {
    expect(clampZoom(0)).toBe(minMapZoom)
    expect(clampZoom(20)).toBe(maxMapZoom)
    expect(clampMapCenter({ latitudeDeg: 90, longitudeDeg: 179 }, 4)).toEqual({
      latitudeDeg: 67.5,
      longitudeDeg: 135,
    })
  })

  it('converts viewport clicks into map points inside the current viewBox', () => {
    expect(
      mapPointFromViewportPoint(
        { clientX: 180, clientY: 90 },
        { left: 0, top: 0, width: 360, height: 180 },
        { x: 90, y: 45, width: 180, height: 90 },
      ),
    ).toEqual({ x: 180, y: 90 })
  })
})
