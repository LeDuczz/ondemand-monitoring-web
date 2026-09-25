import { describe, expect, it } from 'vitest'

import { isSelectableMission } from './useActiveMission'

describe('active mission selection', () => {
  it('keeps scheduled missions selectable after the operator accepts them', () => {
    expect(isSelectableMission('SCHEDULED')).toBe(true)
  })
})
