import { describe, expect, it } from 'vitest'

import { operatorHref, parseOperatorRoute } from './routes'

describe('drone operator routes', () => {
  it('carries the selected mission through flight workflow steps', () => {
    const missionId = '2bf1ecfd-d903-4c31-b53a-f673ed648830'

    expect(operatorHref({ screen: 'connect', missionId })).toBe(
      `#portal/drone-operator/connect/${missionId}`,
    )
    expect(parseOperatorRoute(`#portal/drone-operator/connect/${missionId}`)).toEqual({
      screen: 'connect',
      missionId,
    })
    expect(parseOperatorRoute(`#portal/drone-operator/preflight/${missionId}`)).toEqual({
      screen: 'preflight',
      missionId,
    })
    expect(parseOperatorRoute(`#portal/drone-operator/flight/${missionId}`)).toEqual({
      screen: 'flight',
      missionId,
    })
  })
})
