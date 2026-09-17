import type { SelectedObservationLocation } from '../../app/observation/observationState'
import { defaultStellariumAssets, type StellariumAssetManifest } from './stellariumAssets'

export interface SkyEngine {
  enforceViewBounds(): void
  getConstellationLayers(): SkyConstellationLayers
  getView(): SkyViewState
  resetView(): void
  setConstellationLayers(layers: SkyConstellationLayers): void
  setAzimuthDeg(azimuthDeg: number): void
  setFovDeg(fovDeg: number): void
  syncCurrentTime(observedAt?: Date): void
  startRealtimeSync(): void
  dispose(): void
}

export interface SkyViewState {
  altitudeDeg: number
  azimuthDeg: number
  fovDeg: number
}

export interface SkyConstellationLayers {
  labelsVisible: boolean
  linesVisible: boolean
}

export interface CreateStellariumSkyEngineOptions {
  canvas: HTMLCanvasElement
  location: SelectedObservationLocation
  assets?: StellariumAssetManifest
  fetcher?: typeof fetch
}

interface StellariumDataSource {
  addDataSource(args: { url: string; key?: string }): void
}

interface StellariumCore {
  atmosphere: { visible: boolean }
  constellations: { labels_visible: boolean; lines_visible: boolean }
  fov: number
  planets: StellariumDataSource
  skycultures: StellariumDataSource
  stars: StellariumDataSource
  dsos?: StellariumDataSource
  milkyway?: StellariumDataSource
  time_speed?: number
}

interface StellariumInstance {
  D2R: number
  core: StellariumCore
  observer: {
    elevation: number
    latitude: number
    longitude: number
    pitch: number
    utc: number
    yaw: number
  }
  date2MJD(dateMs: number): number
  setFont(font: 'regular' | 'bold', url: string): Promise<void>
  zoomTo(fovRad: number, durationSeconds: number): void
}

interface StellariumModule {
  default(options: { wasmFile: string; canvas: HTMLCanvasElement }): Promise<StellariumInstance>
}

const initialFovDeg = 70
const initialAltitudeDeg = 45
const initialAzimuthDeg = 180
const viewAngleToleranceDeg = 0.1
export const skyFovBounds = {
  minimumDeg: 20,
  maximumDeg: 120,
  initialDeg: initialFovDeg,
}
export const skyAltitudeBounds = {
  fixedDeg: initialAltitudeDeg,
}

export async function createStellariumSkyEngine({
  canvas,
  location,
  assets = defaultStellariumAssets,
  fetcher = fetch,
}: CreateStellariumSkyEngineOptions): Promise<SkyEngine> {
  const stellarium = await loadStellariumModule(assets, fetcher)
  const engine = await stellarium.default({
    wasmFile: assets.wasmUrl,
    canvas,
  })

  addDataSources(engine.core, assets.dataBaseUrl)
  await Promise.all([
    engine.setFont('regular', assets.fonts.regular),
    engine.setFont('bold', assets.fonts.bold),
  ])

  return new StellariumAdapter(engine, location)
}

async function loadStellariumModule(
  assets: StellariumAssetManifest,
  fetcher: typeof fetch,
): Promise<StellariumModule> {
  const response = await fetcher(assets.scriptUrl)

  if (!response.ok) {
    throw new Error(`Stellarium engine script was not found at ${assets.scriptUrl}`)
  }

  const moduleUrl = URL.createObjectURL(
    new Blob([await response.text()], { type: 'text/javascript' }),
  )

  try {
    return (await import(/* @vite-ignore */ moduleUrl)) as StellariumModule
  } finally {
    URL.revokeObjectURL(moduleUrl)
  }
}

function addDataSources(core: StellariumCore, dataBaseUrl: string): void {
  core.stars.addDataSource({ url: `${dataBaseUrl}stars` })
  core.skycultures.addDataSource({ url: `${dataBaseUrl}skycultures/western`, key: 'western' })
  core.planets.addDataSource({ url: `${dataBaseUrl}surveys/sso/moon`, key: 'moon' })
  core.planets.addDataSource({ url: `${dataBaseUrl}surveys/sso/sun`, key: 'sun' })

  if (core.dsos) {
    core.dsos.addDataSource({ url: `${dataBaseUrl}dso` })
  }

  if (core.milkyway) {
    core.milkyway.addDataSource({ url: `${dataBaseUrl}surveys/milkyway` })
  }
}

class StellariumAdapter implements SkyEngine {
  private readonly engine: StellariumInstance
  private realtimeSyncId: number | null = null

  constructor(engine: StellariumInstance, location: SelectedObservationLocation) {
    this.engine = engine
    this.setObserver(location)
    this.applyDefaultView()
  }

  syncCurrentTime(observedAt = new Date()): void {
    this.engine.observer.utc = this.engine.date2MJD(observedAt.getTime())
  }

  getView(): SkyViewState {
    return {
      altitudeDeg: this.engine.observer.pitch / this.engine.D2R,
      azimuthDeg: normalizeAzimuthDeg(this.engine.observer.yaw / this.engine.D2R),
      fovDeg: this.engine.core.fov / this.engine.D2R,
    }
  }

  getConstellationLayers(): SkyConstellationLayers {
    return {
      labelsVisible: this.engine.core.constellations.labels_visible,
      linesVisible: this.engine.core.constellations.lines_visible,
    }
  }

  setConstellationLayers(layers: SkyConstellationLayers): void {
    this.engine.core.constellations.lines_visible = layers.linesVisible
    this.engine.core.constellations.labels_visible = layers.labelsVisible
  }

  setFovDeg(fovDeg: number): void {
    const clampedFovDeg = clamp(fovDeg, skyFovBounds.minimumDeg, skyFovBounds.maximumDeg)
    this.engine.zoomTo(clampedFovDeg * this.engine.D2R, 0)
  }

  setAzimuthDeg(azimuthDeg: number): void {
    this.engine.observer.yaw = normalizeAzimuthDeg(azimuthDeg) * this.engine.D2R
  }

  resetView(): void {
    this.engine.observer.yaw = initialAzimuthDeg * this.engine.D2R
    this.engine.observer.pitch = initialAltitudeDeg * this.engine.D2R
    this.setFovDeg(initialFovDeg)
  }

  enforceViewBounds(): void {
    const currentFovDeg = this.engine.core.fov / this.engine.D2R
    const currentAltitudeDeg = this.engine.observer.pitch / this.engine.D2R

    if (currentFovDeg < skyFovBounds.minimumDeg || currentFovDeg > skyFovBounds.maximumDeg) {
      this.setFovDeg(currentFovDeg)
    }

    if (Math.abs(currentAltitudeDeg - skyAltitudeBounds.fixedDeg) > viewAngleToleranceDeg) {
      this.engine.observer.pitch = skyAltitudeBounds.fixedDeg * this.engine.D2R
    }

    this.setAzimuthDeg(this.engine.observer.yaw / this.engine.D2R)
  }

  startRealtimeSync(): void {
    this.stopRealtimeSync()
    this.syncCurrentTime()
    this.realtimeSyncId = window.setInterval(() => this.syncCurrentTime(), 1000)
  }

  dispose(): void {
    this.stopRealtimeSync()
  }

  private setObserver(location: SelectedObservationLocation): void {
    this.engine.observer.latitude = location.latitudeDeg * this.engine.D2R
    this.engine.observer.longitude = location.longitudeDeg * this.engine.D2R
    this.engine.observer.elevation = 0
  }

  private applyDefaultView(): void {
    this.engine.core.time_speed = 0
    this.resetView()
    this.engine.core.atmosphere.visible = true
    this.setConstellationLayers({ labelsVisible: true, linesVisible: true })
  }

  private stopRealtimeSync(): void {
    if (this.realtimeSyncId !== null) {
      window.clearInterval(this.realtimeSyncId)
      this.realtimeSyncId = null
    }
  }
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum)
}

export function normalizeAzimuthDeg(azimuthDeg: number): number {
  return ((azimuthDeg % 360) + 360) % 360
}
