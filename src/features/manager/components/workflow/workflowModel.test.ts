import { describe, expect, it } from 'vitest'

import { MISSION_STAGES, missionProgress } from './workflowModel'

describe('Mission workflow', () => {
  it('shows flight permit as step 2 before execution and completion', () => {
    expect(MISSION_STAGES).toEqual([
      'prepare',
      'permit',
      'execute',
      'done',
    ])
    expect(missionProgress('PENDING_APPROVAL').current).toBe('permit')
  })

  it('does not jump back to preparation after a permit is approved', () => {
    expect(
      missionProgress('WAITING_CREW_CONFIRMATION', 'APPROVED').current,
    ).toBe('execute')
  })
})
