import { defineMessages } from '../../../../../shared/i18n'

export const createMissionFormMessages = defineMessages({
  vi: {
    validationRequired: 'Thời gian bắt đầu/kết thúc là bắt buộc.',
    validationInvalidRange: 'Giờ kết thúc phải sau giờ cất cánh.',
    planGenerationFailed:
      'Dịch vụ tạo đường bay báo lỗi cho khu vực này. Vui lòng thử lại hoặc liên hệ quản trị hệ thống.',
    durationHours: (h: number, m: number) =>
      h > 0 ? (m > 0 ? `${h} giờ ${m} phút` : `${h} giờ`) : `${m} phút`,
  },
  en: {
    validationRequired: 'Start/end time is required.',
    validationInvalidRange: 'Finish time must be after takeoff time.',
    planGenerationFailed:
      'The flight-path service returned an error for this area. You can enter waypoints manually.',
    durationHours: (h: number, m: number) =>
      h > 0 ? (m > 0 ? `${h} h ${m} min` : `${h} h`) : `${m} min`,
  },
})
