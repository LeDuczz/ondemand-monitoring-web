import { defineMessages } from '../../../../../shared/i18n'

export const reviewNoticeMessages = defineMessages({
  vi: {
    rejected: 'Đơn bị từ chối',
    approved: 'Đơn đã được duyệt',
    reason: 'Lý do',
    noReason: 'Không có lý do được ghi nhận.',
    by: (name: string) => `bởi ${name}`,
  },
  en: {
    rejected: 'Order rejected',
    approved: 'Order approved',
    reason: 'Reason',
    noReason: 'No reason was recorded.',
    by: (name: string) => `by ${name}`,
  },
})
