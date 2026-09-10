import { useCallback, useMemo, useRef, useState, type PointerEvent, type WheelEvent } from 'react'

import {
  clampMapCenter,
  clampZoom,
  geoCoordinateToMapPoint,
  mapPointFromViewportPoint,
  mapPointToGeoCoordinate,
  maxMapZoom,
  minMapZoom,
  worldMapHeight,
  worldMapWidth,
  type GeoCoordinate,
} from './mapProjection'

interface DragState {
  pointerId: number
  startClientX: number
  startClientY: number
  startCenter: GeoCoordinate
  moved: boolean
}

const initialCenter: GeoCoordinate = {
  latitudeDeg: 12,
  longitudeDeg: 0,
}

export interface MapFocusRequest {
  id: string
  center: GeoCoordinate
  zoom: number
}

interface StaticWorldMapOptions {
  onCoordinateSelect?: (coordinate: GeoCoordinate) => void
}

const clickMoveTolerancePx = 6

export function useStaticWorldMap(
  initialMapCenter: GeoCoordinate = initialCenter,
  initialMapZoom: number = minMapZoom,
  options: StaticWorldMapOptions = {},
) {
  const onCoordinateSelect = options.onCoordinateSelect
  const initialZoom = clampZoom(initialMapZoom)
  const [center, setCenter] = useState(() => clampMapCenter(initialMapCenter, initialZoom))
  const [zoom, setZoom] = useState(initialZoom)
  const dragState = useRef<DragState | null>(null)

  const viewBox = useMemo(() => {
    const width = worldMapWidth / zoom
    const height = worldMapHeight / zoom
    const centerPoint = geoCoordinateToMapPoint(center)

    return {
      x: centerPoint.x - width / 2,
      y: centerPoint.y - height / 2,
      width,
      height,
    }
  }, [center, zoom])

  const zoomBy = useCallback((delta: number) => {
    setZoom((currentZoom) => {
      const nextZoom = clampZoom(currentZoom + delta)

      setCenter((currentCenter) => clampMapCenter(currentCenter, nextZoom))
      return nextZoom
    })
  }, [])

  const reset = useCallback(() => {
    setCenter(initialCenter)
    setZoom(minMapZoom)
  }, [])

  const startDrag = useCallback(
    (event: PointerEvent<SVGSVGElement>) => {
      event.currentTarget.setPointerCapture?.(event.pointerId)
      dragState.current = {
        pointerId: event.pointerId,
        startClientX: event.clientX,
        startClientY: event.clientY,
        startCenter: center,
        moved: false,
      }
    },
    [center],
  )

  const drag = useCallback(
    (event: PointerEvent<SVGSVGElement>) => {
      const currentDrag = dragState.current

      if (!currentDrag || currentDrag.pointerId !== event.pointerId) {
        return
      }

      const bounds = event.currentTarget.getBoundingClientRect()
      const startPoint = geoCoordinateToMapPoint(currentDrag.startCenter)
      const viewBoxWidth = worldMapWidth / zoom
      const viewBoxHeight = worldMapHeight / zoom
      const clientDeltaX = event.clientX - currentDrag.startClientX
      const clientDeltaY = event.clientY - currentDrag.startClientY
      const deltaX = (clientDeltaX / bounds.width) * viewBoxWidth
      const deltaY = (clientDeltaY / bounds.height) * viewBoxHeight

      if (Math.hypot(clientDeltaX, clientDeltaY) > clickMoveTolerancePx) {
        currentDrag.moved = true
      }

      setCenter(
        clampMapCenter(
          mapPointToGeoCoordinate({
            x: startPoint.x - deltaX,
            y: startPoint.y - deltaY,
          }),
          zoom,
        ),
      )
    },
    [zoom],
  )

  const endDrag = useCallback(
    (event: PointerEvent<SVGSVGElement>) => {
      const currentDrag = dragState.current

      if (currentDrag?.pointerId === event.pointerId) {
        if (!currentDrag.moved && onCoordinateSelect) {
          const point = mapPointFromViewportPoint(
            {
              clientX: event.clientX,
              clientY: event.clientY,
            },
            event.currentTarget.getBoundingClientRect(),
            viewBox,
          )

          onCoordinateSelect(mapPointToGeoCoordinate(point))
        }

        event.currentTarget.releasePointerCapture?.(event.pointerId)
        dragState.current = null
      }
    },
    [onCoordinateSelect, viewBox],
  )

  const cancelDrag = useCallback((event: PointerEvent<SVGSVGElement>) => {
    if (dragState.current?.pointerId === event.pointerId) {
      dragState.current = null
    }
  }, [])

  const zoomWithWheel = useCallback(
    (event: WheelEvent<SVGSVGElement>) => {
      event.preventDefault()
      zoomBy(event.deltaY > 0 ? -0.5 : 0.5)
    },
    [zoomBy],
  )

  return {
    center,
    viewBox,
    zoom,
    canZoomIn: zoom < maxMapZoom,
    canZoomOut: zoom > minMapZoom,
    zoomIn: () => zoomBy(0.5),
    zoomOut: () => zoomBy(-0.5),
    reset,
    startDrag,
    drag,
    endDrag,
    cancelDrag,
    zoomWithWheel,
  }
}
