import './styles.css'

const ENGINE_ASSETS = {
  scriptUrl: '/stellarium-engine/stellarium-web-engine.js',
  wasmUrl: '/stellarium-engine/stellarium-web-engine.wasm',
  dataBaseUrl: '/stellarium-skydata/',
  fonts: ['/stellarium-fonts/NotoSans-Regular.ttf', '/stellarium-fonts/NotoSans-Bold.ttf'],
}

const LOCATIONS = {
  seoul: { label: 'Seoul', latitude: 37.5665, longitude: 126.978 },
  'mauna-kea': { label: 'Mauna Kea', latitude: 19.8207, longitude: -155.4681 },
  sydney: { label: 'Sydney', latitude: -33.8688, longitude: 151.2093 },
}

const elements = {
  canvas: document.querySelector('#stel-canvas'),
  status: document.querySelector('#engine-status'),
  utc: document.querySelector('#utc-status'),
  coordinates: document.querySelector('#coordinate-status'),
  fps: document.querySelector('#fps-status'),
  latitude: document.querySelector('#latitude-input'),
  longitude: document.querySelector('#longitude-input'),
  locationForm: document.querySelector('#location-form'),
  fov: document.querySelector('#fov-select'),
  atmosphere: document.querySelector('#atmosphere-toggle'),
  constellationLines: document.querySelector('#constellation-lines-toggle'),
  constellationLabels: document.querySelector('#constellation-labels-toggle'),
  engineCheck: document.querySelector('#check-engine'),
  dataCheck: document.querySelector('#check-data'),
  timeCheck: document.querySelector('#check-time'),
  controlsCheck: document.querySelector('#check-controls'),
}

const setStatus = (message) => {
  elements.status.textContent = message
}

const markCheck = (element, done) => {
  element.dataset.done = done ? 'true' : 'false'
}

const formatCoordinate = ({ latitude, longitude }) =>
  `${latitude.toFixed(4)} deg, ${longitude.toFixed(4)} deg`

const setLocationInputs = (location) => {
  elements.latitude.value = String(location.latitude)
  elements.longitude.value = String(location.longitude)
}

const getLocationFromInputs = () => ({
  label: 'Manual',
  latitude: Number(elements.latitude.value),
  longitude: Number(elements.longitude.value),
})

const isValidLocation = ({ latitude, longitude }) =>
  Number.isFinite(latitude) &&
  Number.isFinite(longitude) &&
  latitude >= -90 &&
  latitude <= 90 &&
  longitude >= -180 &&
  longitude <= 180

const addDataSources = (core) => {
  const baseUrl = ENGINE_ASSETS.dataBaseUrl

  core.stars.addDataSource({ url: `${baseUrl}stars` })
  core.skycultures.addDataSource({ url: `${baseUrl}skycultures/western`, key: 'western' })
  core.planets.addDataSource({ url: `${baseUrl}surveys/sso/moon`, key: 'moon' })
  core.planets.addDataSource({ url: `${baseUrl}surveys/sso/sun`, key: 'sun' })

  if (core.dsos) {
    core.dsos.addDataSource({ url: `${baseUrl}dso` })
  }

  if (core.milkyway) {
    core.milkyway.addDataSource({ url: `${baseUrl}surveys/milkyway` })
  }
}

const applyLocation = (stel, location) => {
  if (!isValidLocation(location)) {
    setStatus('Check coordinate ranges.')
    return
  }

  // Stellarium Web Engine observer coordinates use radians, not degrees.
  stel.observer.latitude = location.latitude * stel.D2R
  stel.observer.longitude = location.longitude * stel.D2R
  stel.observer.elevation = 0
  elements.coordinates.textContent = `${location.label} - ${formatCoordinate(location)}`
  markCheck(elements.controlsCheck, true)
}

const applySkyOptions = (stel) => {
  stel.zoomTo(Number(elements.fov.value) * stel.D2R, 0)
  stel.core.atmosphere.visible = elements.atmosphere.checked
  stel.core.constellations.lines_visible = elements.constellationLines.checked
  stel.core.constellations.labels_visible = elements.constellationLabels.checked
  markCheck(elements.controlsCheck, true)
}

const updateRealtimeUtc = (stel) => {
  const now = new Date()

  // date2MJD converts epoch milliseconds to Modified Julian Date.
  // Product policy allows only current UTC: no time picker, pause, or speed control.
  stel.observer.utc = stel.date2MJD(now.getTime())
  elements.utc.textContent = now.toISOString()
  elements.fps.textContent = `${stel.core.fps ?? 0}`
  markCheck(elements.timeCheck, true)
}

const bindControls = (stel) => {
  elements.locationForm.addEventListener('submit', (event) => {
    event.preventDefault()
    applyLocation(stel, getLocationFromInputs())
  })

  document.querySelectorAll('[data-location]').forEach((button) => {
    button.addEventListener('click', () => {
      const location = LOCATIONS[button.dataset.location]
      setLocationInputs(location)
      applyLocation(stel, location)
    })
  })

  ;[
    elements.fov,
    elements.atmosphere,
    elements.constellationLines,
    elements.constellationLabels,
  ].forEach((input) => {
    input.addEventListener('change', () => applySkyOptions(stel))
  })
}

const loadEngine = async () => {
  setStatus('Loading engine script')
  const response = await fetch(ENGINE_ASSETS.scriptUrl)

  if (!response.ok) {
    throw new Error(`Cannot load ${ENGINE_ASSETS.scriptUrl}`)
  }

  // Vite blocks direct source imports from public/. A Blob module keeps the
  // pinned engine as a static asset while still loading its ES module export.
  const engineModuleUrl = URL.createObjectURL(
    new Blob([await response.text()], { type: 'text/javascript' }),
  )
  const importEngineModule = new Function('url', 'return import(url)')
  const module = await importEngineModule(engineModuleUrl)
  URL.revokeObjectURL(engineModuleUrl)

  setStatus('Initializing WASM')
  return module.default({
    wasmFile: ENGINE_ASSETS.wasmUrl,
    canvas: elements.canvas,
  })
}

const main = async () => {
  try {
    const stel = await loadEngine()
    const defaultLocation = LOCATIONS.seoul

    markCheck(elements.engineCheck, true)
    setStatus('Attaching data sources')
    addDataSources(stel.core)
    markCheck(elements.dataCheck, true)

    await Promise.all([
      stel.setFont('regular', ENGINE_ASSETS.fonts[0]),
      stel.setFont('bold', ENGINE_ASSETS.fonts[1]),
    ])

    setLocationInputs(defaultLocation)
    applyLocation(stel, defaultLocation)
    applySkyOptions(stel)
    bindControls(stel)
    updateRealtimeUtc(stel)
    setInterval(() => updateRealtimeUtc(stel), 1000)

    setStatus('Rendering')
  } catch (error) {
    console.error(error)
    setStatus(error instanceof Error ? error.message : 'Engine initialization failed')
  }
}

void main()
