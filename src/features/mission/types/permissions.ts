export type MissionPermissions = {
  canRespond: boolean
  canControlFlight: boolean
  canOperatePayload: boolean
  canInspectDevice: boolean
  canMaintainDevice: boolean
  canUploadMedia: boolean
}

export type MissionAction =
  'connect' | 'handover' | 'flight' | 'preflight' | 'postflight' | 'upload'

export function mayPerformMissionAction(
  permissions: MissionPermissions,
  action: MissionAction,
): boolean {
  if (action === 'preflight' || action === 'postflight')
    return permissions.canInspectDevice
  if (action === 'upload') return permissions.canUploadMedia
  return permissions.canControlFlight
}
