import { expect, test } from '@playwright/test'

// Drone flies north at 15 m/s; the controller reports its latest PX4 position on every poll.
const START = { lat: 10.80, lon: 106.70 }
const SPEED_MPS = 15

test('drone marker and camera move continuously while flying', async ({ page }) => {
  const t0 = Date.now()
  let statusCalls = 0
  await page.route('http://localhost:8090/**', async (route) => {
    const url = route.request().url()
    if (url.includes('/api/control/status')) {
      statusCalls += 1
      const s = (Date.now() - t0) / 1000
      const lat = START.lat + (SPEED_MPS * s) / 111_320
      return route.fulfill({
        json: {
          online: true, inAir: true, missionId: 'MS-1', deviceId: 'DRN-1', positionReady: true,
          positionGps: { latitude: lat, longitude: START.lon, absoluteAltitudeM: 40, relativeAltitudeM: 30 },
          yawDeg: 0, speedMps: SPEED_MPS, batteryPercent: 88, batteryDrainMode: 'CRUISE',
        },
      })
    }
    return route.fulfill({ json: {} })
  })
  await page.route('**/api/zones**', (route) => route.fulfill({ json: { data: [] } }))
  await page.goto('/e2e/harness/flight.html')

  const marker = page.locator('.satellite-drone-arrow-icon')
  await expect(marker).toBeVisible({ timeout: 15_000 })
  await page.waitForTimeout(1500) // let polling settle

  // Sample the marker's map position (relative to the map pane) every 100 ms for 6 s.
  const samples: number[] = await page.evaluate(async () => {
    const out: number[] = []
    for (let i = 0; i < 60; i += 1) {
      const el = document.querySelector('.satellite-drone-arrow-icon') as HTMLElement
      const m = /translate3d\(([-\d.]+)px, ([-\d.]+)px/.exec(el.style.transform)
      out.push(m ? Number(m[2]) : NaN)
      await new Promise((r) => setTimeout(r, 100))
    }
    return out
  })
  const moved = samples.slice(1).map((y, i) => Math.abs(y - samples[i]) > 0.05)
  const movingRatio = moved.filter(Boolean).length / moved.length
  let longestStill = 0
  let run = 0
  for (const m of moved) { run = m ? 0 : run + 1; longestStill = Math.max(longestStill, run) }
  console.log(`status polls=${statusCalls} moving=${(movingRatio * 100).toFixed(0)}% longestStill=${longestStill * 100}ms`)

  expect(statusCalls).toBeGreaterThan(10)
  expect(movingRatio).toBeGreaterThan(0.85)
  expect(longestStill).toBeLessThanOrEqual(4) // never frozen for more than ~0.4 s

  // camera follows the same telemetry (no waiting overlay while GPS is live)
  await expect(page.getByText('ĐANG CHỜ TELEMETRY')).toHaveCount(0)
})
