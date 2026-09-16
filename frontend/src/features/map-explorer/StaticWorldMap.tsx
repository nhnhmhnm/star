import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import L, { type LayerGroup, type Map as LeafletMap } from 'leaflet'
import 'leaflet/dist/leaflet.css'

import { createNightBoundary, getDarknessCenter } from '../map-lighting/mapLighting'
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
  selectedPopup?: ReactNode
}

const nightRegionStyle: L.PathOptions = {
  fillColor: '#040c22',
  fillOpacity: 0.42,
  interactive: false,
  stroke: false,
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

function toDisplayLongitude(longitudeDeg: number, worldCenterLongitudeDeg: number): number {
  return worldCenterLongitudeDeg + normalizeLongitude(longitudeDeg - worldCenterLongitudeDeg)
}

function applyMinimumNonWrappingZoom(map: LeafletMap, container: HTMLDivElement): void {
  const minimumZoom = getMinimumNonWrappingZoom(container.clientWidth, container.clientHeight)

  map.setMinZoom(minimumZoom)

  if (map.getZoom() < minimumZoom) {
    map.setZoom(minimumZoom, { animate: false })
  }
}

function shouldPreferCanvasRenderer(): boolean {
  return typeof navigator === 'undefined' || !navigator.userAgent.includes('jsdom')
}

export function StaticWorldMap({
  focusRequest = null,
  nightAltitudeThresholdDeg = null,
  onCoordinateSelect,
  presenceCells = [],
  selectedCoordinate = null,
  selectedPopup = null,
}: StaticWorldMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const lightingLayerRef = useRef<LayerGroup | null>(null)
  const markerLayerRef = useRef<LayerGroup | null>(null)
  const presenceLayerRef = useRef<LayerGroup | null>(null)
  const [snapshotAt] = useState(() => new Date())
  const [initialCenter] = useState(() => getDarknessCenter(snapshotAt))
  const [worldBounds] = useState(() =>
    L.latLngBounds([
      [-85, initialCenter.longitudeDeg - 180],
      [85, initialCenter.longitudeDeg + 180],
    ]),
  )
  const onCoordinateSelectRef = useRef(onCoordinateSelect)
  const selectedCoordinateRef = useRef(selectedCoordinate)
  const [selectedPopupPosition, setSelectedPopupPosition] = useState<{
    x: number
    y: number
  } | null>(null)
  const [viewState, setViewState] = useState({
    center: initialCenter,
    minZoom: minMapZoom,
    zoom: minMapZoom,
  })

  useEffect(() => {
    onCoordinateSelectRef.current = onCoordinateSelect
  }, [onCoordinateSelect])

  useEffect(() => {
    selectedCoordinateRef.current = selectedCoordinate
  }, [selectedCoordinate])

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
      minZoom: getMinimumNonWrappingZoom(container.clientWidth, container.clientHeight),
      preferCanvas: shouldPreferCanvasRenderer(),
      worldCopyJump: false,
      zoomControl: false,
    })
    map.setView([initialCenter.latitudeDeg, initialCenter.longitudeDeg], map.getMinZoom())
    applyMinimumNonWrappingZoom(map, container)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      bounds: worldBounds,
      maxZoom: maxMapZoom,
      minZoom: map.getMinZoom(),
    }).addTo(map)

    lightingLayerRef.current = L.layerGroup().addTo(map)
    markerLayerRef.current = L.layerGroup().addTo(map)
    presenceLayerRef.current = L.layerGroup().addTo(map)

    const updateViewState = () => {
      setViewState(getViewState(map))
      setSelectedPopupPosition(
        getSelectedPopupPosition(map, selectedCoordinateRef.current, initialCenter.longitudeDeg),
      )
    }
    const updateMinimumZoom = () => {
      applyMinimumNonWrappingZoom(map, container)
      updateViewState()
    }

    map.on('moveend zoomend', updateViewState)
    map.on('click', (event) => {
      setSelectedPopupPosition({ x: event.containerPoint.x, y: event.containerPoint.y })
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
  }, [initialCenter.latitudeDeg, initialCenter.longitudeDeg, worldBounds])

  useEffect(() => {
    if (!focusRequest) {
      return
    }

    const map = mapRef.current

    if (!map) {
      return
    }

    map.setView(
      [
        focusRequest.center.latitudeDeg,
        toDisplayLongitude(focusRequest.center.longitudeDeg, initialCenter.longitudeDeg),
      ],
      Math.max(focusRequest.zoom, map.getMinZoom()),
      { animate: false },
    )
    setViewState(getViewState(map))
  }, [focusRequest, initialCenter.longitudeDeg])

  useEffect(() => {
    const layer = lightingLayerRef.current

    if (!layer) {
      return
    }

    layer.clearLayers()

    if (nightAltitudeThresholdDeg === null) {
      return
    }

    const boundary = createNightBoundary(snapshotAt, nightAltitudeThresholdDeg).map((point) => [
      point.latitudeDeg,
      toDisplayLongitude(point.longitudeDeg, initialCenter.longitudeDeg),
    ]) as L.LatLngExpression[]

    L.polygon(boundary, nightRegionStyle).addTo(layer)
  }, [initialCenter.longitudeDeg, nightAltitudeThresholdDeg, snapshotAt])

  useEffect(() => {
    const layer = markerLayerRef.current

    if (!layer) {
      return
    }

    layer.clearLayers()

    if (!selectedCoordinate) {
      return
    }

    L.marker(
      [
        selectedCoordinate.latitudeDeg,
        toDisplayLongitude(selectedCoordinate.longitudeDeg, initialCenter.longitudeDeg),
      ],
      {
        icon: L.divIcon({
          className: styles.selectedMarker,
          html: '<span></span>',
        }),
        interactive: false,
      },
    ).addTo(layer)
  }, [initialCenter.longitudeDeg, selectedCoordinate])

  useEffect(() => {
    const layer = presenceLayerRef.current

    if (!layer) {
      return
    }

    layer.clearLayers()

    presenceCells.forEach((cell) => {
      L.marker(
        [cell.latitudeDeg, toDisplayLongitude(cell.longitudeDeg, initialCenter.longitudeDeg)],
        {
          icon: L.divIcon({
            className: styles.presencePin,
            html: cell.members.length > 1 ? String(cell.members.length) : '',
          }),
          interactive: false,
        },
      ).addTo(layer)
    })
  }, [initialCenter.longitudeDeg, presenceCells])

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
  }, [initialCenter])
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
      {selectedCoordinate && selectedPopup && selectedPopupPosition ? (
        <div
          className={styles.selectedPopup}
          style={{ left: selectedPopupPosition.x, top: selectedPopupPosition.y }}
        >
          {selectedPopup}
        </div>
      ) : null}
    </div>
  )
}

function getSelectedPopupPosition(
  map: LeafletMap | null,
  coordinate: GeoCoordinate | null,
  worldCenterLongitudeDeg: number,
): { x: number; y: number } | null {
  if (!map || !coordinate) {
    return null
  }

  const point = map.latLngToContainerPoint([
    coordinate.latitudeDeg,
    toDisplayLongitude(coordinate.longitudeDeg, worldCenterLongitudeDeg),
  ])

  return { x: point.x, y: point.y }
}
