import { defineMessages } from '../../../../../shared/i18n'

export const planFailedStateMessages = defineMessages({
  vi: {
    planFailedTitle: 'Không tạo được kế hoạch bay',
    planFailedBody:
      'Dịch vụ tạo đường bay báo lỗi cho khu vực này. Vui lòng thử lại hoặc liên hệ quản trị hệ thống.',
    retry: 'Thử lại',
  },
  en: {
    planFailedTitle: 'Could not generate a flight plan',
    planFailedBody:
      'The flight-path service returned an error for this area. You can enter waypoints manually.',
    retry: 'Retry',
  },
})
