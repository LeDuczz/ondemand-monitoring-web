export type MissionPermissions = {
  canAttachChecklistEvidence?: boolean
  canDetachChecklistEvidence?: boolean
  canRespond: boolean
  canControlFlight: boolean
  canOperatePayload: boolean
  canInspectDevice: boolean
  canMaintainDevice: boolean
  canUploadMedia: boolean
  canCompleteMission?: boolean
  canSubmitMissionResult?: boolean
  canExecuteMonitoringChecklist?: boolean
}

export type MissionAction =
  'connect' | 'handover' | 'flight' | 'preflight' | 'postflight' | 'upload'

export function mayPerformMissionAction(
  permissions: MissionPermissions,
  action: MissionAction,
): boolean {
  if (action === 'connect' || action === 'preflight' || action === 'handover')
    return permissions.canOperatePayload
  if (action === 'postflight') return permissions.canMaintainDevice
  if (action === 'upload')
    return permissions.canUploadMedia || permissions.canControlFlight || permissions.canExecuteMonitoringChecklist === true || permissions.canSubmitMissionResult === true
  return permissions.canControlFlight
}
