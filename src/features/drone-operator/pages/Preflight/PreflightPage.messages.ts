import { defineMessages } from '../../../../shared/i18n'

export const preflightPageMessages = defineMessages({
  vi: {
    noMissionSelected: 'Chưa chọn mission',
    noDroneAssignedError: 'Mission chưa được gán thiết bị',
    confirmPrecheckFailed: 'Không xác nhận được precheck',
    loadMissionFailed: 'Không tải được mission',
    confirmingTelemetry: 'Đang xác nhận telemetry, precheck và flight token…',
  },
  en: {
    noMissionSelected: 'No mission selected',
    noDroneAssignedError: 'Mission has no device assigned',
    confirmPrecheckFailed: 'Could not confirm the precheck',
    loadMissionFailed: 'Could not load the mission',
    confirmingTelemetry: 'Confirming telemetry, precheck, and flight token…',
  },
})
