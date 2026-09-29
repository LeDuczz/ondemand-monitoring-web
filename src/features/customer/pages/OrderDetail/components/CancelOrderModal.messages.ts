import { defineMessages } from '../../../../../shared/i18n'

export const cancelOrderModalMessages = defineMessages({
  vi: {
    title: 'Huỷ đơn hàng?',
    subtitle: 'Thao tác này không thể hoàn tác.',
    body: (title: string) =>
      `Bạn có chắc muốn huỷ đơn "${title}"? Bộ phận vận hành sẽ không xử lý đơn này nữa.`,
    keep: 'Giữ đơn',
    confirm: 'Huỷ đơn hàng',
    cancelling: 'Đang huỷ...',
    failed: 'Không thể huỷ đơn. Vui lòng thử lại.',
  },
  en: {
    title: 'Cancel this order?',
    subtitle: 'This action cannot be undone.',
    body: (title: string) =>
      `Are you sure you want to cancel "${title}"? Operations will no longer process it.`,
    keep: 'Keep order',
    confirm: 'Cancel order',
    cancelling: 'Cancelling...',
    failed: 'Unable to cancel the order. Please try again.',
  },
})
