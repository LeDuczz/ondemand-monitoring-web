import { beforeEach, describe, expect, it } from 'vitest'
import { clearMissionCreationKey, missionCreationKey } from './missionCreationIntent'

describe('pending Mission creation intent', () => {
  const intent = { scopeLabel: 'Whole Order scope', scheduledStart: '2026-10-08T08:00:00+07:00', scheduledEnd: '2026-10-08T09:00:00+07:00' }
  beforeEach(() => sessionStorage.clear())
  it('reuses the persisted key across retries and equivalent timestamps/text', () => {
    const first = missionCreationKey('o', intent)
    expect(missionCreationKey('o', { ...intent, scopeLabel: ' Whole  Order scope ', scheduledStart: '2026-10-08T01:00:00Z' })).toBe(first)
    expect(JSON.parse(sessionStorage.getItem('odms:pending-mission-creation:o')!).key).toBe(first)
  })
  it('separates Orders and distinct business intents', () => {
    const first = missionCreationKey('o', intent)
    expect(missionCreationKey('other', intent)).not.toBe(first)
    expect(missionCreationKey('o', { ...intent, scopeLabel: 'Another scope' })).not.toBe(first)
  })
  it('clears only after acknowledged success', () => {
    const first = missionCreationKey('o', intent)
    clearMissionCreationKey('o')
    expect(missionCreationKey('o', intent)).not.toBe(first)
  })
  it('includes replacement original in the retry identity', () => {
    const original = missionCreationKey('o', { ...intent, replacesMissionId: 'm1' })
    expect(missionCreationKey('o', { ...intent, replacesMissionId: 'm1' })).toBe(original)
    expect(missionCreationKey('o', { ...intent, replacesMissionId: 'm2' })).not.toBe(original)
  })
})
