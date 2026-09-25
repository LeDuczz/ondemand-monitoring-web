import { describe, expect, it } from 'vitest'

import { isSelectableMission, mergeMissionSnapshot } from './useActiveMission'

describe('active mission selection', () => {
  it('keeps scheduled missions selectable after the operator accepts them', () => {
    expect(isSelectableMission('SCHEDULED')).toBe(true)
  })

  it('keeps the mission selectable while moving through connect and preflight', () => {
    expect(isSelectableMission('CONNECTED')).toBe(true)
    expect(isSelectableMission('PREFLIGHT_CHECKING')).toBe(true)
    expect(isSelectableMission('READY_TO_FLY')).toBe(true)
    expect(isSelectableMission('FAILED_PREFLIGHT')).toBe(true)
  })

  it('keeps the assigned drone from the list when detail temporarily omits it', () => {
    expect(
      mergeMissionSnapshot(
        { id: 'm-1', status: 'READY_TO_FLY', droneCode: null },
        { id: 'm-1', status: 'CONNECTED', droneCode: 'DRN-0052' },
      )?.droneCode,
    ).toBe('DRN-0052')
  })
})
