import { geoCoordinateToMapPoint, type GeoCoordinate } from './mapProjection'
import { MapLightingOverlay } from '../map-lighting/MapLightingOverlay'
import styles from './StaticWorldMap.module.css'
import { useStaticWorldMap, type MapFocusRequest } from './useStaticWorldMap'

const graticuleValues = [-120, -60, 0, 60, 120]

interface StaticWorldMapProps {
  focusRequest?: MapFocusRequest | null
  nightAltitudeThresholdDeg?: number | null
  onCoordinateSelect?: (coordinate: GeoCoordinate) => void
  selectedCoordinate?: GeoCoordinate | null
}

export function StaticWorldMap({
  focusRequest = null,
  nightAltitudeThresholdDeg = null,
  onCoordinateSelect,
  selectedCoordinate = null,
}: StaticWorldMapProps) {
  const map = useStaticWorldMap(focusRequest?.center, focusRequest?.zoom, { onCoordinateSelect })
  const selectedPoint = selectedCoordinate ? geoCoordinateToMapPoint(selectedCoordinate) : null

  return (
    <div className={styles.mapShell}>
      <svg
        aria-label="세계지도 영역"
        className={styles.map}
        role="img"
        viewBox={`${map.viewBox.x} ${map.viewBox.y} ${map.viewBox.width} ${map.viewBox.height}`}
        onPointerDown={map.startDrag}
        onPointerMove={map.drag}
        onPointerUp={map.endDrag}
        onPointerCancel={map.cancelDrag}
        onWheel={map.zoomWithWheel}
      >
        <rect className={styles.ocean} x="0" y="0" width="360" height="180" />
        <g className={styles.graticule}>
          {graticuleValues.map((longitude) => (
            <line
              key={`lng-${longitude}`}
              x1={longitude + 180}
              y1="0"
              x2={longitude + 180}
              y2="180"
            />
          ))}
          {[-60, -30, 0, 30, 60].map((latitude) => (
            <line key={`lat-${latitude}`} x1="0" y1={90 - latitude} x2="360" y2={90 - latitude} />
          ))}
        </g>
        <g className={styles.land}>
          <polygon points="28,45 52,26 96,30 118,48 106,72 75,80 42,70" />
          <polygon points="88,78 112,88 118,124 100,160 82,132 72,96" />
          <polygon points="140,43 178,31 214,41 224,69 197,82 158,73" />
          <polygon points="188,76 226,70 265,92 254,128 214,120" />
          <polygon points="246,52 298,58 318,84 286,104 248,86" />
          <polygon points="274,124 318,132 330,152 294,158" />
          <polygon points="122,150 220,148 275,160 240,172 142,170" />
        </g>
        <MapLightingOverlay nightAltitudeThresholdDeg={nightAltitudeThresholdDeg} />
        <g className={styles.labels} aria-hidden="true">
          <text x="70" y="56">
            North America
          </text>
          <text x="92" y="117">
            South America
          </text>
          <text x="178" y="60">
            Europe
          </text>
          <text x="210" y="99">
            Africa
          </text>
          <text x="276" y="75">
            Asia
          </text>
          <text x="303" y="145">
            Australia
          </text>
        </g>
        {selectedPoint ? (
          <g className={styles.selectedMarker} aria-hidden="true">
            <circle cx={selectedPoint.x} cy={selectedPoint.y} r="3.5" />
            <circle cx={selectedPoint.x} cy={selectedPoint.y} r="7" />
          </g>
        ) : null}
      </svg>
      <div className={styles.controls} aria-label="지도 조작">
        <button type="button" onClick={map.zoomIn} disabled={!map.canZoomIn}>
          확대
        </button>
        <button type="button" onClick={map.zoomOut} disabled={!map.canZoomOut}>
          축소
        </button>
        <button type="button" onClick={map.reset}>
          초기화
        </button>
      </div>
      <p className={styles.status} aria-live="polite">
        지도 중심 위도 {map.center.latitudeDeg.toFixed(2)}°, 경도{' '}
        {map.center.longitudeDeg.toFixed(2)}° · 배율 {map.zoom.toFixed(1)}x
      </p>
    </div>
  )
}
