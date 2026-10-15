import type { MissionStaffRole } from '../../mission/types/mission'
import { defineMessages, getLanguage } from '../../../shared/i18n'

const readinessMessages = defineMessages({
  vi: {
    missingStaff: 'Thiếu nhân sự',
    noDevice: 'Chưa gán thiết bị',
    awaitingConfirm: 'Chờ xác nhận phân công',
    assigned: 'Đã phân công nguồn lực',
  },
  en: {
    missingStaff: 'Staff missing',
    noDevice: 'No device assigned',
    awaitingConfirm: 'Awaiting assignment confirmation',
    assigned: 'Resources assigned',
  },
})

export const requiredAssignmentRoles: MissionStaffRole[] = [
  'PILOT',
  'OPERATOR',
  'MAINTAINER',
  'INSPECTOR',
]
type AssignmentSnapshot = {
  status: string
  deviceId?: string | null
  droneId?: string | null
  staffAssignments?: {
    staffId: string
    assignedRole: MissionStaffRole
    responseStatus?: string
  }[]
}

/** Manager submission is distinct from crew acceptance. Never infer it from checkbox/local state. */
export function assignmentReadiness(mission: AssignmentSnapshot) {
  const missingRoles = requiredAssignmentRoles.filter(
    (role) =>
      !mission.staffAssignments?.some(
        (person) =>
          person.assignedRole === role &&
          Boolean(person.staffId) &&
          person.responseStatus !== 'REJECTED',
      ),
  )
  const device = Boolean(mission.deviceId || mission.droneId)
  const setupState = [
    'RESOURCE_ASSIGNING',
    'WAITING_CREW_CONFIRMATION',
  ].includes(mission.status)
  const submitted =
    mission.status !== 'RESOURCE_ASSIGNING' && mission.status !== 'CREATED'
  const complete = !missingRoles.length && device && submitted
  const step = missingRoles.length ? 'staff' : !device ? 'device' : 'confirm'
  const t = readinessMessages[getLanguage()]
  const label = !setupState
    ? null
    : missingRoles.length
      ? t.missingStaff
      : !device
        ? t.noDevice
        : !submitted
          ? t.awaitingConfirm
          : t.assigned
  return {
    missingRoles,
    device,
    complete,
    step,
    label,
    needsSetup: setupState && !complete,
  } as const
}
