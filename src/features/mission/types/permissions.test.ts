import { describe, expect, it } from 'vitest'
import { mayPerformMissionAction, type MissionPermissions } from './permissions'

const none: MissionPermissions = {
  canRespond: false,
  canControlFlight: false,
  canInspectDevice: false,
  canMaintainDevice: false,
  canOperatePayload: false,
  canUploadMedia: false,
}

describe('mission action permissions', () => {
  it('does not grant flight or inspection merely because the user is Staff', () => {
    expect(mayPerformMissionAction(none, 'flight')).toBe(false)
    expect(mayPerformMissionAction(none, 'preflight')).toBe(false)
  })
  it('lets an inspector inspect without handing over flight control', () => {
    const inspector = { ...none, canInspectDevice: true }
    expect(mayPerformMissionAction(inspector, 'preflight')).toBe(true)
    expect(mayPerformMissionAction(inspector, 'postflight')).toBe(true)
    expect(mayPerformMissionAction(inspector, 'handover')).toBe(false)
  })
  it('allows media upload independently of flying and maintenance', () => {
    const operator = { ...none, canUploadMedia: true }
    expect(mayPerformMissionAction(operator, 'upload')).toBe(true)
    expect(mayPerformMissionAction(operator, 'connect')).toBe(false)
  })
})
