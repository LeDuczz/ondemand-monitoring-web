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
  it('does not let an inspector run maintainer postcheck', () => {
    const inspector = { ...none, canInspectDevice: true }
    expect(mayPerformMissionAction(inspector, 'preflight')).toBe(false)
    expect(mayPerformMissionAction(inspector, 'postflight')).toBe(false)
    expect(mayPerformMissionAction(inspector, 'handover')).toBe(false)
  })
  it('lets a maintainer run postcheck', () => {
    const maintainer = { ...none, canMaintainDevice: true }
    expect(mayPerformMissionAction(maintainer, 'postflight')).toBe(true)
    expect(mayPerformMissionAction(maintainer, 'upload')).toBe(false)
  })
  it('lets an operator connect, preflight, and hand over before pilot control', () => {
    const operator = { ...none, canOperatePayload: true }
    expect(mayPerformMissionAction(operator, 'connect')).toBe(true)
    expect(mayPerformMissionAction(operator, 'preflight')).toBe(true)
    expect(mayPerformMissionAction(operator, 'handover')).toBe(true)
    expect(mayPerformMissionAction(operator, 'flight')).toBe(false)
  })
  it('allows media upload independently of flying and maintenance', () => {
    const operator = { ...none, canUploadMedia: true }
    expect(mayPerformMissionAction(operator, 'upload')).toBe(true)
    expect(mayPerformMissionAction(operator, 'connect')).toBe(false)
  })
  it('lets the assigned pilot open media in view-only mode', () => {
    const pilot = { ...none, canControlFlight: true }
    expect(mayPerformMissionAction(pilot, 'upload')).toBe(true)
    expect(mayPerformMissionAction(pilot, 'connect')).toBe(false)
  })
  it('lets one accepted staff member with all mission roles perform the full flow', () => {
    const soloCrew = {
      ...none,
      canControlFlight: true,
      canOperatePayload: true,
      canMaintainDevice: true,
      canUploadMedia: true,
      canExecuteMonitoringChecklist: true,
    }
    expect(mayPerformMissionAction(soloCrew, 'connect')).toBe(true)
    expect(mayPerformMissionAction(soloCrew, 'preflight')).toBe(true)
    expect(mayPerformMissionAction(soloCrew, 'handover')).toBe(true)
    expect(mayPerformMissionAction(soloCrew, 'flight')).toBe(true)
    expect(mayPerformMissionAction(soloCrew, 'postflight')).toBe(true)
    expect(mayPerformMissionAction(soloCrew, 'upload')).toBe(true)
  })
})
