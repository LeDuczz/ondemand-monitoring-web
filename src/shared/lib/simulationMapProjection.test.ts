import { describe, expect, it } from 'vitest'

import {
  SIMULATION_MAP_DEFAULT_CROP,
  viewportPercentToWorld,
  worldToViewportPercent,
} from './simulationMapProjection'

const meta = {
  minX: -417.15933531249993,
  maxX: 415.15933531249993,
  minY: -414.65578218749977,
  maxY: 417.66288843749993,
}

describe('simulation map projection', () => {
  it('round-trips viewport click coordinates through world coordinates', () => {
    const click = { x: 78.4, y: 56.8 }
    const world = viewportPercentToWorld(click, meta, SIMULATION_MAP_DEFAULT_CROP)
    const projected = worldToViewportPercent(world, meta, SIMULATION_MAP_DEFAULT_CROP)

    expect(projected.x).toBeCloseTo(click.x, 6)
    expect(projected.y).toBeCloseTo(click.y, 6)
  })

  it('projects a selected construction-site target back to the same visible map point', () => {
    const world = { simX: 226.6, simY: -41.2 }
    const visiblePoint = worldToViewportPercent(world, meta, SIMULATION_MAP_DEFAULT_CROP)
    const roundTrip = viewportPercentToWorld(visiblePoint, meta, SIMULATION_MAP_DEFAULT_CROP)

    expect(roundTrip.simX).toBeCloseTo(world.simX, 6)
    expect(roundTrip.simY).toBeCloseTo(world.simY, 6)
  })
})
