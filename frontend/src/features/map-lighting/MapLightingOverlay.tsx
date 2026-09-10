import { useMemo, useState } from 'react'

import styles from './MapLightingOverlay.module.css'
import { createLightingCells } from './mapLighting'

interface MapLightingOverlayProps {
  nightAltitudeThresholdDeg: number | null
}

export function MapLightingOverlay({ nightAltitudeThresholdDeg }: MapLightingOverlayProps) {
  const [snapshotAt] = useState(() => new Date())
  const cells = useMemo(
    () =>
      nightAltitudeThresholdDeg === null
        ? []
        : createLightingCells(snapshotAt, nightAltitudeThresholdDeg),
    [nightAltitudeThresholdDeg, snapshotAt],
  )

  if (nightAltitudeThresholdDeg === null) {
    return null
  }

  return (
    <g className={styles.overlay} aria-hidden="true">
      {cells.map((cell) => (
        <rect
          key={cell.id}
          className={styles[cell.band]}
          x={cell.x}
          y={cell.y}
          width={cell.width}
          height={cell.height}
        />
      ))}
    </g>
  )
}
