import { describe, expect, it } from 'vitest'

import { preflightSummary } from './preflightSummary'
import type { PreflightItem } from '../types/mission'

function items(
  pairs: [PreflightItem['key'], PreflightItem['result']][],
): PreflightItem[] {
  return pairs.map(([key, result]) => ({ key, result }))
}

describe('preflightSummary', () => {
  it('reports in-progress while nothing has failed and not all items are ok', () => {
    const summary = preflightSummary(
      items([
        ['battery', 'ok'],
        ['localPosition', 'ok'],
      ]),
      12,
    )
    expect(summary).toMatchObject({
      nOk: 2,
      nTotal: 12,
      nFail: 0,
      isProgress: true,
      isPass: false,
      isFail: false,
    })
  })

  it('is PASS only when every item is ok', () => {
    const all: PreflightItem['key'][] = [
      'gazebo',
      'px4',
      'mavsdk',
      'px4Control',
      'localPosition',
      'mavsdkHealth',
      'battery',
      'lidar',
      'camera',
      'backend',
      'media',
      'modules',
    ]
    const summary = preflightSummary(items(all.map((k) => [k, 'ok'])), 12)
    expect(summary.isPass).toBe(true)
    expect(summary.isFail).toBe(false)
    expect(summary.nOk).toBe(12)
  })

  it('is FAIL and lists the failing keys as soon as one item fails', () => {
    const summary = preflightSummary(
      items([
        ['battery', 'ok'],
        ['px4', 'fail'],
        ['mavsdk', 'fail'],
      ]),
      12,
    )
    expect(summary.isFail).toBe(true)
    expect(summary.isPass).toBe(false)
    expect(summary.nFail).toBe(2)
    expect(summary.failKeys).toEqual(['px4', 'mavsdk'])
  })
})
