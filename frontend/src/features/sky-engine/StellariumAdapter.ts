import type { SelectedObservationLocation } from '../../app/observation/observationState'
import { defaultStellariumAssets, type StellariumAssetManifest } from './stellariumAssets'

export interface SkyEngine {
  syncCurrentTime(observedAt?: Date): void
  startRealtimeSync(): void
  dispose(): void
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
    utc: number
  }
  date2MJD(dateMs: number): number
  setFont(font: 'regular' | 'bold', url: string): Promise<void>
  zoomTo(fovRad: number, durationSeconds: number): void
}

interface StellariumModule {
  default(options: { wasmFile: string; canvas: HTMLCanvasElement }): Promise<StellariumInstance>
}

const initialFovDeg = 70

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
    this.engine.zoomTo(initialFovDeg * this.engine.D2R, 0)
    this.engine.core.atmosphere.visible = true
    this.engine.core.constellations.lines_visible = true
    this.engine.core.constellations.labels_visible = true
  }

  private stopRealtimeSync(): void {
    if (this.realtimeSyncId !== null) {
      window.clearInterval(this.realtimeSyncId)
      this.realtimeSyncId = null
    }
  }
}
