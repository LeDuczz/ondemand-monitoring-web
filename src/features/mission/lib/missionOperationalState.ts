import { defineMessages, getLanguage } from '../../../shared/i18n'

const stopMessages = defineMessages({
  vi: {
    cancelled: 'Đã hủy',
    failed: 'Dừng an toàn cần xử lý lại',
    readyToCancel: 'Sẵn sàng hủy',
    confirmed: 'Đã xác nhận an toàn',
    stopping: 'Đang dừng an toàn',
  },
  en: {
    cancelled: 'Cancelled',
    failed: 'Safe stop needs retry',
    readyToCancel: 'Ready to cancel',
    confirmed: 'Safety confirmed',
    stopping: 'Safe stop in progress',
  },
})

/** Safe-stop overlays presentation, without changing the persisted Mission lifecycle. */
export type MissionStopMetadata = {
  safeStopStatus?: string | null
  safeStopRequestedAt?: string | null
  safeStopConfirmedAt?: string | null
  safeStopCleanedAt?: string | null
}

export function missionHasSafeStop(
  mission: MissionStopMetadata | null | undefined,
): boolean {
  return Boolean(
    mission?.safeStopStatus ||
    mission?.safeStopRequestedAt ||
    mission?.safeStopConfirmedAt ||
    mission?.safeStopCleanedAt,
  )
}

export function missionStopLabel(
  mission:
    | (MissionStopMetadata & {
        status?: string
        backendStatus?: string
      })
    | null
    | undefined,
): string | null {
  if (!mission) return null
  const t = stopMessages[getLanguage()]
  if ((mission.backendStatus ?? mission.status) === 'CANCELLED')
    return t.cancelled
  if (!missionHasSafeStop(mission)) return null
  if (mission.safeStopStatus === 'FAILED') return t.failed
  if (
    mission.safeStopCleanedAt ||
    mission.safeStopStatus === 'READY_FOR_CANCELLATION'
  )
    return t.readyToCancel
  if (mission.safeStopConfirmedAt) return t.confirmed
  return t.stopping
}

export function maySendFlightCommand(
  command: string,
  normal: boolean,
  terminate: boolean,
): boolean {
  return (
    normal ||
    (terminate &&
      ['return_to_base', 'land', 'stop', 'emergency_stop'].includes(command))
  )
}

/** Narrow an explicit capability using the Mission snapshot; never infer permission from status. */
export function missionMayTerminate(
  mission:
    | (MissionStopMetadata & { status?: string; backendStatus?: string })
    | null
    | undefined,
  permitted?: boolean,
): boolean {
  return (
    mission != null &&
    permitted === true &&
    missionHasSafeStop(mission) &&
    !mission.safeStopConfirmedAt &&
    !mission.safeStopCleanedAt &&
    mission.safeStopStatus !== 'READY_FOR_CANCELLATION' &&
    [
      'CONNECTED',
      'PREFLIGHT_CHECKING',
      'READY_TO_FLY',
      'IN_FLIGHT',
      'IN_PROGRESS',
      'RETURNING',
    ].includes(mission.backendStatus ?? mission.status ?? '')
  )
}
