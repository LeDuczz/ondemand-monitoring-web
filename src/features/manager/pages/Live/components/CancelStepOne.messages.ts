import { defineMessages } from '../../../../../shared/i18n'

export const cancelStepOneMessages = defineMessages({
  vi: {
    cancelModal: {
      step1Title: '⚠ Huỷ mission khẩn',
      step1Body:
        'đang hoạt động. Huỷ sẽ gửi lệnh RTL tới drone. Hành động không thể hoàn tác.',
      reasonLabel: 'Lý do huỷ',
      reasonPlaceholder: 'Lý do huỷ mission…',
      close: 'Đóng',
      continue: 'Tiếp tục →',
    },
    mission: 'Mission',
  },
  en: {
    cancelModal: {
      step1Title: '⚠ Emergency mission cancel',
      step1Body:
        'is active. Cancelling will send an RTL command to the drone. This action cannot be undone.',
      reasonLabel: 'Cancellation reason',
      reasonPlaceholder: 'Reason for cancelling the mission…',
      close: 'Close',
      continue: 'Continue →',
    },
    mission: 'Mission',
  },
})
