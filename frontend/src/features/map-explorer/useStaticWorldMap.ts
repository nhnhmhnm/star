import { useCallback, useMemo, useRef, useState, type PointerEvent, type WheelEvent } from 'react'

import {
  clampMapCenter,
  clampZoom,
  geoCoordinateToMapPoint,
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
}

const initialCenter: GeoCoordinate = {
  latitudeDeg: 12,
  longitudeDeg: 0,
}

export function useStaticWorldMap() {
  const [center, setCenter] = useState(initialCenter)
  const [zoom, setZoom] = useState(minMapZoom)
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
      event.currentTarget.setPointerCapture(event.pointerId)
      dragState.current = {
        pointerId: event.pointerId,
        startClientX: event.clientX,
        startClientY: event.clientY,
        startCenter: center,
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
      const deltaX = ((event.clientX - currentDrag.startClientX) / bounds.width) * viewBoxWidth
      const deltaY = ((event.clientY - currentDrag.startClientY) / bounds.height) * viewBoxHeight

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

  const endDrag = useCallback((event: PointerEvent<SVGSVGElement>) => {
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
    zoomWithWheel,
  }
}
