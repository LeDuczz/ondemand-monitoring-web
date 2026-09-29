import { defineMessages } from '../../../../../shared/i18n'

export const orderTimelineMessages = defineMessages({
  vi: {
    title: 'Tiến trình đơn hàng',
    created: 'Đơn được gửi',
    approved: 'Đã được duyệt',
    rejected: 'Bị từ chối',
    by: (name: string) => `bởi ${name}`,
  },
  en: {
    title: 'Order progress',
    created: 'Order submitted',
    approved: 'Approved',
    rejected: 'Rejected',
    by: (name: string) => `by ${name}`,
  },
})
