import { defineMessages } from '../../../../shared/i18n'

export const handoverPageMessages = defineMessages({
  vi: {
    noMissionSelected: 'Chưa chọn mission',
    noDroneAssigned: 'Chưa gán thiết bị',
    noDroneAssignedError: 'Chọn mission đã gán thiết bị trước khi tiếp tục',
    confirmFailed: 'Không xác nhận được cam kết',
    stepTitle: 'Bàn giao quyền điều khiển',
  },
  en: {
    noMissionSelected: 'No mission selected',
    noDroneAssigned: 'No device assigned',
    noDroneAssignedError:
      'Select a mission with an assigned device before continuing',
    confirmFailed: 'Could not confirm the commitments',
    stepTitle: 'Control handover',
  },
})
