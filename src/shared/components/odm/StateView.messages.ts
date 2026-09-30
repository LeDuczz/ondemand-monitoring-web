import { defineMessages } from '../../i18n'

export const stateViewMessages = defineMessages({
  vi: {
    loading: 'Đang tải…',
    errorTitle: 'Không tải được dữ liệu',
    genericError:
      'Đã có lỗi khi kết nối tới máy chủ. Kiểm tra mạng rồi thử lại.',
    retry: 'Thử lại',
  },
  en: {
    loading: 'Loading…',
    errorTitle: 'Could not load data',
    genericError:
      'A server connection error occurred. Check your network and try again.',
    retry: 'Retry',
  },
})
