import { useRef, type KeyboardEvent, type PointerEvent, type WheelEvent } from 'react'

import type { SelectedObservationLocation } from '../app/observation/observationState'
import {
  getCardinalDirectionCode,
  getCompassDirectionWindow,
} from '../features/sky-engine/skyCompass'
import { useCurrentSkyEngine } from '../features/sky-engine/useCurrentSkyEngine'
import { normalizeAzimuthDeg, skyFovBounds } from '../features/sky-engine/StellariumAdapter'
import type { PublicAppConfig } from '../shared/api/publicConfig'
import styles from './SkyViewerPage.module.css'

interface SkyViewerPageProps {
  config: PublicAppConfig
  selectedLocation: SelectedObservationLocation
}

export function SkyViewerPage({ config, selectedLocation }: SkyViewerPageProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const horizontalDragRef = useRef<{ pointerId: number; x: number } | null>(null)
  const sky = useCurrentSkyEngine({
    canvasRef,
    location: selectedLocation,
    nightAltitudeThresholdDeg: config.nightAltitudeThresholdDeg,
  })
  const canvasClassName =
    sky.status === 'ready' ? styles.canvas : `${styles.canvas} ${styles.canvasHidden}`

  function startHorizontalDrag(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return
    }

    event.currentTarget.setPointerCapture(event.pointerId)
    horizontalDragRef.current = { pointerId: event.pointerId, x: event.clientX }
  }

  function moveHorizontalDrag(event: PointerEvent<HTMLDivElement>) {
    const drag = horizontalDragRef.current

    if (!drag || drag.pointerId !== event.pointerId) {
      return
    }

    const deltaX = event.clientX - drag.x
    const degreesPerPixel = sky.view.fovDeg / Math.max(event.currentTarget.clientWidth, 1)

    horizontalDragRef.current = { ...drag, x: event.clientX }
    sky.panHorizontal(-deltaX * degreesPerPixel)
  }

  function stopHorizontalDrag(event: PointerEvent<HTMLDivElement>) {
    if (horizontalDragRef.current?.pointerId !== event.pointerId) {
      return
    }

    horizontalDragRef.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  function zoomWithWheel(event: WheelEvent<HTMLDivElement>) {
    event.preventDefault()

    if (event.deltaY < 0) {
      sky.zoomIn()
    } else if (event.deltaY > 0) {
      sky.zoomOut()
    }
  }

  function controlWithKeyboard(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault()
      sky.panHorizontal(event.key === 'ArrowLeft' ? -10 : 10)
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      sky.zoomIn()
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      sky.zoomOut()
    }
  }

  return (
    <section className={styles.page} aria-labelledby="sky-title">
      <canvas
        ref={canvasRef}
        aria-label={`${selectedLocation.label} 현재 밤하늘`}
        className={canvasClassName}
      />
      {sky.status === 'ready' ? (
        <div
          className={styles.interactionSurface}
          role="application"
          tabIndex={0}
          aria-label="밤하늘 수평 탐색 영역. 좌우로 드래그하고 위아래 방향키나 휠로 확대하거나 축소합니다."
          onKeyDown={controlWithKeyboard}
          onPointerCancel={stopHorizontalDrag}
          onPointerDown={startHorizontalDrag}
          onPointerMove={moveHorizontalDrag}
          onPointerUp={stopHorizontalDrag}
          onWheel={zoomWithWheel}
        />
      ) : null}
      <div className={styles.statusPanel}>
        <p className={styles.eyebrow}>{selectedLocation.label}</p>
        <h1 className={styles.title} id="sky-title">
          현재 밤하늘
        </h1>
        <p className={styles.description}>
          위도 {selectedLocation.latitudeDeg.toFixed(4)}°, 경도{' '}
          {selectedLocation.longitudeDeg.toFixed(4)}°
        </p>
        {sky.status === 'ready' ? (
          <>
            <div className={styles.controls} aria-label="하늘 방향과 확대 조작">
              <button
                type="button"
                className={styles.controlButton}
                onClick={sky.zoomOut}
                disabled={sky.view.fovDeg >= skyFovBounds.maximumDeg}
                aria-label="축소, 아래 방향키"
                title="축소 (↓)"
              >
                ↓
              </button>
              <button
                type="button"
                className={styles.controlButton}
                onClick={sky.resetView}
                aria-label="초기 시선으로 복구"
                title="초기 시선으로 복구"
              >
                ↺
              </button>
              <button
                type="button"
                className={styles.controlButton}
                onClick={sky.zoomIn}
                disabled={sky.view.fovDeg <= skyFovBounds.minimumDeg}
                aria-label="확대, 위 방향키"
                title="확대 (↑)"
              >
                ↑
              </button>
              <span className={styles.fovValue}>FOV {Math.round(sky.view.fovDeg)}°</span>
            </div>
            <p className={styles.viewHint} aria-live="polite">
              방향 {formatCardinalDirection(sky.view.azimuthDeg)} · 고도{' '}
              {Math.round(sky.view.altitudeDeg)}° 고정
            </p>
            <div className={styles.layerControls} aria-label="별자리 표시">
              <button
                type="button"
                className={styles.toggleButton}
                aria-pressed={sky.constellationLayers.linesVisible}
                onClick={() =>
                  sky.setConstellationLinesVisible(!sky.constellationLayers.linesVisible)
                }
              >
                별자리 선
              </button>
              <button
                type="button"
                className={styles.toggleButton}
                aria-pressed={sky.constellationLayers.labelsVisible}
                onClick={() =>
                  sky.setConstellationLabelsVisible(!sky.constellationLayers.labelsVisible)
                }
              >
                별자리 이름
              </button>
            </div>
          </>
        ) : null}
      </div>
      {sky.status === 'ready' ? <SkyCompass azimuthDeg={sky.view.azimuthDeg} /> : null}
      {sky.status !== 'ready' ? (
        <div className={styles.overlay} role="status" aria-live="polite">
          <p className={styles.overlayTitle}>{formatSkyStatusTitle(sky.status)}</p>
          <p className={styles.overlayMessage}>{sky.message}</p>
          {sky.status === 'error' ? (
            <div className={styles.overlayActions}>
              <button type="button" className={styles.retryButton} onClick={sky.retry}>
                다시 시도
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}

function SkyCompass({ azimuthDeg }: { azimuthDeg: number }) {
  const activeDirection = getCardinalDirectionCode(azimuthDeg)
  const visibleDirections = getCompassDirectionWindow(azimuthDeg)

  return (
    <div className={styles.compass} aria-label={`현재 방위 ${activeDirection}`}>
      <div className={styles.compassMarker} aria-hidden="true" />
      <div className={styles.compassDirections}>
        {visibleDirections.map((direction) => (
          <span
            key={direction}
            className={direction === activeDirection ? styles.activeDirection : undefined}
          >
            {direction}
          </span>
        ))}
      </div>
      <p>{Math.round(normalizeAzimuthDeg(azimuthDeg))}° · 좌우로 드래그</p>
    </div>
  )
}

function formatCardinalDirection(azimuthDeg: number): string {
  const labels = { N: '북', E: '동', S: '남', W: '서' }

  return labels[getCardinalDirectionCode(azimuthDeg)]
}

function formatSkyStatusTitle(status: ReturnType<typeof useCurrentSkyEngine>['status']): string {
  switch (status) {
    case 'loading':
      return '밤하늘을 불러오는 중'
    case 'blocked':
      return '현재 기준으로 관측할 수 없음'
    case 'error':
      return 'Stellarium 엔진을 불러오지 못함'
    case 'ready':
      return '현재 밤하늘'
  }
}
