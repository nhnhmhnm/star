import { maxMapZoom, minMapZoom } from './mapProjection'

const tileSizePx = 256

export function getMinimumNonWrappingZoom(containerWidthPx: number): number {
  if (containerWidthPx <= tileSizePx) {
    return minMapZoom
  }

  return Math.min(
    maxMapZoom,
    Math.max(minMapZoom, Math.ceil(Math.log2(containerWidthPx / tileSizePx))),
  )
}
