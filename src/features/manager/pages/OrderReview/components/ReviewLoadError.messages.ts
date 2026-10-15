import { defineMessages } from '../../../../../shared/i18n'

export const reviewLoadErrorMessages = defineMessages({
  vi: {
    loadError: 'Không tải được hồ sơ đơn',
    error409:
      'Đơn không còn ở trạng thái chờ duyệt (đã được xử lý bởi đồng nghiệp) hoặc máy chủ lỗi.',
    errorGeneric:
      'Đã có lỗi khi kết nối tới máy chủ. Kiểm tra mạng rồi thử lại.',
    backToQueue: 'Về hàng đợi',
  },
  en: {
    loadError: 'Could not load the order file',
    error409:
      'The order is no longer pending review (already handled by a colleague) or the server errored.',
    errorGeneric:
      'Something went wrong connecting to the server. Check your connection and try again.',
    backToQueue: 'Back to the queue',
  },
})
