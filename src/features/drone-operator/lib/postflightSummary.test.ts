import { describe, expect, it } from 'vitest'

import type { PostflightItem } from '../types/mission'
import { postflightSummary } from './postflightSummary'

describe('postflightSummary', () => {
  it('is overall_ok only when every item is answered ok', () => {
    const items: PostflightItem[] = [
      { key: 'battery_ok', result: 'ok' },
      { key: 'motor_ok', result: 'ok' },
      { key: 'camera_ok', result: 'ok' },
      { key: 'gps_ok', result: 'ok' },
      { key: 'communication_ok', result: 'ok' },
      { key: 'physical_condition_ok', result: 'ok' },
    ]
    const summary = postflightSummary(items, 6)
    expect(summary.nOk).toBe(6)
    expect(summary.overallOk).toBe(true)
    expect(summary.failKeys).toEqual([])
  })

  it('flags failures and lists their keys', () => {
    const items: PostflightItem[] = [
      { key: 'battery_ok', result: 'ok' },
      { key: 'motor_ok', result: 'fail' },
      { key: 'camera_ok', result: 'ok' },
      { key: 'gps_ok', result: 'ok' },
      { key: 'communication_ok', result: 'fail' },
      { key: 'physical_condition_ok', result: 'ok' },
    ]
    const summary = postflightSummary(items, 6)
    expect(summary.overallOk).toBe(false)
    expect(summary.failKeys).toEqual(['motor_ok', 'communication_ok'])
  })

  it('is not overall_ok when the checklist is incomplete', () => {
    const items: PostflightItem[] = [{ key: 'battery_ok', result: 'ok' }]
    const summary = postflightSummary(items, 6)
    expect(summary.overallOk).toBe(false)
  })
})
