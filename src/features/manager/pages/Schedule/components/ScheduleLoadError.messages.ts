import { defineMessages } from '../../../../../shared/i18n'

export const scheduleLoadErrorMessages = defineMessages({
  vi: {
    loadError: 'Không tải được lịch',
    genericError:
      'Đã có lỗi khi kết nối tới máy chủ. Kiểm tra mạng rồi thử lại.',
    retry: 'Thử lại',
    missionsFrom: ' /missions?from=',
  },
  en: {
    loadError: 'Could not load the schedule',
    genericError:
      'Something went wrong connecting to the server. Check your connection and try again.',
    retry: 'Try again',
    missionsFrom: ' /missions?from=',
  },
})
