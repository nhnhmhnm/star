import { describe, expect, it, vi } from 'vitest'

import { fetchPublicAppConfig, parsePublicAppConfig, PublicConfigError } from './publicConfig'

describe('fetchPublicAppConfig', () => {
  it('loads the public app config from the backend', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          nightAltitudeThresholdDeg: -18,
          presenceCellSizeDeg: 0.25,
          presenceHeartbeatSeconds: 20,
        }),
    })

    await expect(fetchPublicAppConfig(fetcher)).resolves.toEqual({
      nightAltitudeThresholdDeg: -18,
      presenceCellSizeDeg: 0.25,
      presenceHeartbeatSeconds: 20,
    })
    expect(fetcher).toHaveBeenCalledWith('/config/public')
  })

  it('rejects invalid backend responses', () => {
    expect(() =>
      parsePublicAppConfig({
        nightAltitudeThresholdDeg: -18,
        presenceCellSizeDeg: 0,
        presenceHeartbeatSeconds: 20,
      }),
    ).toThrow(PublicConfigError)
  })
})
