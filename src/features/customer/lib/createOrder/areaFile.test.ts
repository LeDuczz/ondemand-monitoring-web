import { describe, expect, it } from 'vitest'

import { findPermitZone } from './airspace'
import { parseAreaFile } from './areaFile'

describe('findPermitZone', () => {
  it('flags points near Tan Son Nhat airport', () => {
    expect(findPermitZone({ latitude: 10.815, longitude: 106.66 })?.code).toBe('TAN_SON_NHAT')
  })

  it('counts the monitoring radius', () => {
    const edge = { latitude: 10.8188, longitude: 106.652 + 0.03 } // ~3.3 km east
    expect(findPermitZone(edge, 0)).toBeNull()
    expect(findPermitZone(edge, 500)?.code).toBe('TAN_SON_NHAT')
  })

  it('ignores district 1 and invalid points', () => {
    expect(findPermitZone({ latitude: 10.7769, longitude: 106.7009 })).toBeNull()
    expect(findPermitZone({ latitude: 999, longitude: 0 })).toBeNull()
  })
})

describe('parseAreaFile', () => {
  it('reads a GeoJSON polygon centre and radius', () => {
    const geojson = JSON.stringify({
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[[106.7, 10.77], [106.71, 10.77], [106.71, 10.78], [106.7, 10.78], [106.7, 10.77]]],
      },
    })
    const area = parseAreaFile('site.geojson', geojson)
    expect(area?.latitude).toBeCloseTo(10.775, 5)
    expect(area?.longitude).toBeCloseTo(106.705, 5)
    expect(area?.radiusM).toBeGreaterThanOrEqual(100)
    expect(area?.radiusM).toBeLessThanOrEqual(1500)
    expect(area?.lengthM).toBeUndefined()
  })

  it('measures GeoJSON line length', () => {
    const area = parseAreaFile(
      'runway.json',
      JSON.stringify({ type: 'LineString', coordinates: [[106.65, 10.8], [106.65, 10.81]] }),
    )
    expect(area?.lengthM).toBeGreaterThan(1000)
    expect(area?.lengthM).toBeLessThan(1200)
  })

  it('reads KML coordinates', () => {
    const kml = `<kml><Placemark><LineString><coordinates>106.65,10.8,0 106.65,10.805,0</coordinates></LineString></Placemark></kml>`
    const area = parseAreaFile('path.kml', kml)
    expect(area?.latitude).toBeCloseTo(10.8025, 4)
    expect(area?.lengthM).toBeGreaterThan(500)
  })

  it('returns null for unreadable or unrelated files', () => {
    expect(parseAreaFile('bad.geojson', 'not json')).toBeNull()
    expect(parseAreaFile('empty.kml', '<kml></kml>')).toBeNull()
    expect(parseAreaFile('plan.pdf', '%PDF')).toBeNull()
  })
})
