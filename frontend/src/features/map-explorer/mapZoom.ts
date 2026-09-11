import { maxMapZoom, minMapZoom } from './mapProjection'

const tileSizePx = 256

export function getMinimumNonWrappingZoom(
  containerWidthPx: number,
  containerHeightPx = tileSizePx,
): number {
  return Math.min(
    maxMapZoom,
    Math.max(
      minMapZoom,
      getMinimumZoomForPixels(containerWidthPx),
      getMinimumZoomForPixels(containerHeightPx),
    ),
  )
}

function getMinimumZoomForPixels(pixelLength: number): number {
  if (pixelLength <= tileSizePx) {
    return minMapZoom
  }

  return Math.ceil(Math.log2(pixelLength / tileSizePx))
}
