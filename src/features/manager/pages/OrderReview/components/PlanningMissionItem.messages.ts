import { defineMessages } from '../../../../../shared/i18n'

export const planningMissionItemMessages = defineMessages({
  vi: {
    cancelMission: (code: string) => `Hủy Mission ${code}`,
    cancelReason: (code: string) => `Lý do hủy ${code}`,
    confirmCancel: 'Xác nhận hủy Mission',
    close: 'Đóng',
    createReplacement: (code: string) => `Tạo Mission thay thế cho ${code}`,
  },
  en: {
    cancelMission: (code: string) => `Cancel Mission ${code}`,
    cancelReason: (code: string) => `Reason for cancelling ${code}`,
    confirmCancel: 'Confirm Mission cancellation',
    close: 'Close',
    createReplacement: (code: string) =>
      `Create replacement Mission for ${code}`,
  },
})
