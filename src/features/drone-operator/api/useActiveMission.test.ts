import { describe, expect, it } from 'vitest'

import { isSelectableMission } from './useActiveMission'

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
})
