import { useCallback, useEffect, useRef, useState } from 'react'
import L, { type LayerGroup, type Map as LeafletMap } from 'leaflet'
import 'leaflet/dist/leaflet.css'

import { createLightingCells, type MapLightingBand } from '../map-lighting/mapLighting'
import type { PresenceCell } from '../presence/presenceClient'
import {
  clampLatitude,
  maxMapZoom,
  minMapZoom,
  normalizeLongitude,
  type GeoCoordinate,
} from './mapProjection'
import { getMinimumNonWrappingZoom } from './mapZoom'
import styles from './StaticWorldMap.module.css'
import type { MapFocusRequest } from './useStaticWorldMap'

interface StaticWorldMapProps {
  focusRequest?: MapFocusRequest | null
  nightAltitudeThresholdDeg?: number | null
  onCoordinateSelect?: (coordinate: GeoCoordinate) => void
  presenceCells?: PresenceCell[]
  selectedCoordinate?: GeoCoordinate | null
}

const initialCenter: GeoCoordinate = {
  latitudeDeg: 12,
  longitudeDeg: 0,
}
const worldBounds = L.latLngBounds([
  [-85, -180],
  [85, 180],
])

const lightingBandStyles: Record<MapLightingBand, L.PathOptions> = {
  day: { fillColor: '#ffdd8e', fillOpacity: 0.22 },
  'civil-twilight': { fillColor: '#8797c4', fillOpacity: 0.22 },
  'nautical-twilight': { fillColor: '#314a7a', fillOpacity: 0.26 },
  'astronomical-twilight': { fillColor: '#15244e', fillOpacity: 0.3 },
  night: { fillColor: '#040c22', fillOpacity: 0.42 },
}

function getViewState(map: LeafletMap) {
  const center = map.getCenter()

  return {
    center: {
      latitudeDeg: clampLatitude(center.lat),
      longitudeDeg: normalizeLongitude(center.lng),
    },
    minZoom: map.getMinZoom(),
    zoom: map.getZoom(),
  }
}

function applyMinimumNonWrappingZoom(map: LeafletMap, container: HTMLDivElement): void {
  const minimumZoom = getMinimumNonWrappingZoom(container.clientWidth)

  map.setMinZoom(minimumZoom)

  if (map.getZoom() < minimumZoom) {
    map.setZoom(minimumZoom, { animate: false })
  }
}

export function StaticWorldMap({
  focusRequest = null,
  nightAltitudeThresholdDeg = null,
  onCoordinateSelect,
  presenceCells = [],
  selectedCoordinate = null,
}: StaticWorldMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const lightingLayerRef = useRef<LayerGroup | null>(null)
  const markerLayerRef = useRef<LayerGroup | null>(null)
  const presenceLayerRef = useRef<LayerGroup | null>(null)
  const snapshotAtRef = useRef(new Date())
  const onCoordinateSelectRef = useRef(onCoordinateSelect)
  const [viewState, setViewState] = useState({
    center: initialCenter,
    minZoom: minMapZoom,
    zoom: minMapZoom,
  })

  useEffect(() => {
    onCoordinateSelectRef.current = onCoordinateSelect
  }, [onCoordinateSelect])

  useEffect(() => {
    const container = containerRef.current

    if (!container || mapRef.current) {
      return undefined
    }

    const map = L.map(container, {
      attributionControl: true,
      maxBounds: worldBounds,
      maxBoundsViscosity: 1,
      maxZoom: maxMapZoom,
      minZoom: getMinimumNonWrappingZoom(container.clientWidth),
      worldCopyJump: false,
      zoomControl: false,
    })
    applyMinimumNonWrappingZoom(map, container)
    map.setView([initialCenter.latitudeDeg, initialCenter.longitudeDeg], map.getMinZoom())

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      bounds: worldBounds,
      maxZoom: maxMapZoom,
      minZoom: map.getMinZoom(),
      noWrap: true,
    }).addTo(map)

    lightingLayerRef.current = L.layerGroup().addTo(map)
    markerLayerRef.current = L.layerGroup().addTo(map)
    presenceLayerRef.current = L.layerGroup().addTo(map)

    const updateViewState = () => setViewState(getViewState(map))
    const updateMinimumZoom = () => {
      applyMinimumNonWrappingZoom(map, container)
      updateViewState()
    }

    map.on('moveend zoomend', updateViewState)
    map.on('click', (event) => {
      onCoordinateSelectRef.current?.({
        latitudeDeg: clampLatitude(event.latlng.lat),
        longitudeDeg: normalizeLongitude(event.latlng.lng),
      })
    })

    mapRef.current = map
    updateViewState()
    window.addEventListener('resize', updateMinimumZoom)

    return () => {
      window.removeEventListener('resize', updateMinimumZoom)
      map.remove()
      mapRef.current = null
      lightingLayerRef.current = null
      markerLayerRef.current = null
      presenceLayerRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!focusRequest) {
      return
    }

    const map = mapRef.current

    if (!map) {
      return
    }

    map.setView(
      [focusRequest.center.latitudeDeg, focusRequest.center.longitudeDeg],
      Math.max(focusRequest.zoom, map.getMinZoom()),
    )
    setViewState(getViewState(map))
  }, [focusRequest])

  useEffect(() => {
    const layer = lightingLayerRef.current

    if (!layer) {
      return
    }

    layer.clearLayers()

    if (nightAltitudeThresholdDeg === null) {
      return
    }

    createLightingCells(snapshotAtRef.current, nightAltitudeThresholdDeg).forEach((cell) => {
      const west = cell.x - 180
      const east = west + cell.width
      const north = 90 - cell.y
      const south = north - cell.height

      L.rectangle(
        [
          [south, west],
          [north, east],
        ],
        {
          ...lightingBandStyles[cell.band],
          interactive: false,
          stroke: false,
        },
      ).addTo(layer)
    })
  }, [nightAltitudeThresholdDeg])

  useEffect(() => {
    const layer = markerLayerRef.current

    if (!layer) {
      return
    }

    layer.clearLayers()

    if (!selectedCoordinate) {
      return
    }

    L.marker([selectedCoordinate.latitudeDeg, selectedCoordinate.longitudeDeg], {
      icon: L.divIcon({
        className: styles.selectedMarker,
        html: '<span></span>',
      }),
      interactive: false,
    }).addTo(layer)
  }, [selectedCoordinate])

  useEffect(() => {
    const layer = presenceLayerRef.current

    if (!layer) {
      return
    }

    layer.clearLayers()

    presenceCells.forEach((cell) => {
      L.marker([cell.latitudeDeg, cell.longitudeDeg], {
        icon: L.divIcon({
          className: styles.presencePin,
          html: cell.members.length > 1 ? String(cell.members.length) : '',
        }),
        interactive: false,
      }).addTo(layer)
    })
  }, [presenceCells])

  const zoomIn = useCallback(() => {
    const map = mapRef.current

    if (!map) {
      return
    }

    setViewState((current) => {
      const nextZoom = Math.min(current.zoom + 1, maxMapZoom)

      map.setZoom(nextZoom, { animate: false })

      return { ...getViewState(map), zoom: nextZoom }
    })
  }, [])
  const zoomOut = useCallback(() => {
    const map = mapRef.current

    if (!map) {
      return
    }

    setViewState((current) => {
      const nextZoom = Math.max(current.zoom - 1, current.minZoom)

      map.setZoom(nextZoom, { animate: false })

      return { ...getViewState(map), zoom: nextZoom }
    })
  }, [])
  const reset = useCallback(() => {
    const map = mapRef.current

    if (!map) {
      return
    }

    map.setView([initialCenter.latitudeDeg, initialCenter.longitudeDeg], map.getMinZoom(), {
      animate: false,
    })
    setViewState(getViewState(map))
  }, [])

  return (
    <div className={styles.mapShell}>
      <div ref={containerRef} aria-label="세계지도 영역" className={styles.map} />
      <div className={styles.controls} aria-label="지도 조작">
        <button type="button" onClick={zoomIn} disabled={viewState.zoom >= maxMapZoom}>
          확대
        </button>
        <button type="button" onClick={zoomOut} disabled={viewState.zoom <= viewState.minZoom}>
          축소
        </button>
        <button type="button" onClick={reset}>
          초기화
        </button>
      </div>
      <p className={styles.status} aria-live="polite">
        지도 중심 위도 {viewState.center.latitudeDeg.toFixed(2)}°, 경도{' '}
        {viewState.center.longitudeDeg.toFixed(2)}° · 확대 {viewState.zoom.toFixed(1)}
      </p>
    </div>
  )
}
