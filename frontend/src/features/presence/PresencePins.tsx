import { geoCoordinateToMapPoint } from '../map-explorer/mapProjection'
import type { PresenceCell } from './presenceClient'
import styles from './PresencePins.module.css'

interface PresencePinsProps {
  cells: PresenceCell[]
}

export function PresencePins({ cells }: PresencePinsProps) {
  if (cells.length === 0) {
    return null
  }

  return (
    <g className={styles.pins} aria-hidden="true">
      {cells.map((cell) => {
        const point = geoCoordinateToMapPoint({
          latitudeDeg: cell.latitudeDeg,
          longitudeDeg: cell.longitudeDeg,
        })
        const memberCount = cell.members.length

        return (
          <g key={cell.cellId} transform={`translate(${point.x} ${point.y})`}>
            <circle r="5.4" />
            {memberCount > 1 ? <text y="1.8">{memberCount}</text> : null}
          </g>
        )
      })}
    </g>
  )
}
