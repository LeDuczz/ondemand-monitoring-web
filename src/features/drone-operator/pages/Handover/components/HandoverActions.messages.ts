import { defineMessages } from '../../../../../shared/i18n'

export const handoverActionsMessages = defineMessages({
  vi: {
    back: 'Quay lại',
    processing: 'Đang xử lý...',
    confirmHandover: 'Xác nhận bàn giao',
    confirmLockedNote:
      'Nút xác nhận bị khoá đến khi bạn tick đủ 4 cam kết. Nếu bạn kiêm pilot, hệ thống sẽ chuyển thẳng sang buồng lái sau khi xác nhận.',
  },
  en: {
    back: 'Back',
    processing: 'Processing...',
    confirmHandover: 'Confirm handover',
    confirmLockedNote:
      'The confirm button stays locked until all 4 commitments are checked. If you also have the pilot role, you will go straight to the cockpit after confirmation.',
  },
})
