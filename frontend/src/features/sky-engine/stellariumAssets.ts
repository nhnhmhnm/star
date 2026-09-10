export interface StellariumAssetManifest {
  scriptUrl: string
  wasmUrl: string
  dataBaseUrl: string
  fonts: {
    regular: string
    bold: string
  }
}

export const defaultStellariumAssets: StellariumAssetManifest = {
  scriptUrl: '/stellarium-engine/stellarium-web-engine.js',
  wasmUrl: '/stellarium-engine/stellarium-web-engine.wasm',
  dataBaseUrl: '/stellarium-skydata/',
  fonts: {
    regular: '/stellarium-fonts/NotoSans-Regular.ttf',
    bold: '/stellarium-fonts/NotoSans-Bold.ttf',
  },
}
