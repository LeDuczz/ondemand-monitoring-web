import { defineMessages } from '../../../../shared/i18n'

export const availabilityPageMessages = defineMessages({
  vi: {
    loadFailedTitle: 'Không tải được lịch rảnh',
    loadFailedDesc: 'Mất kết nối hoặc máy chủ đang bận.',
    retry: 'Thử lại',
    overlayLabels: [
      '0139-1 Đã nhận',
      '0152-1 Chờ phản hồi',
      '0154-1 Chờ phản hồi',
    ],
  },
  en: {
    loadFailedTitle: 'Could not load availability',
    loadFailedDesc: 'Connection lost or the server is busy.',
    retry: 'Retry',
    overlayLabels: [
      '0139-1 Accepted',
      '0152-1 Awaiting reply',
      '0154-1 Awaiting reply',
    ],
  },
})
