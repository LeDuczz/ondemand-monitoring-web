import { defineMessages } from '../../../../../shared/i18n'

export const scheduleCardMessages = defineMessages({
  vi: {
    cardTitle: 'Lịch bay mong muốn',
    dateRangeHint:
      'Chọn khoảng ngày bạn muốn drone bay. Ngày sớm nhất phải từ ngày mai trở đi.',
    advanceNoticeTitle: 'Lưu ý đặt lịch: ',
    advanceNoticeBody:
      'Ví dụ hôm nay là 03/10 thì ngày sớm nhất bạn có thể chọn là 04/10.',
    startDate: 'Ngày sớm nhất',
    endDate: 'Ngày muộn nhất',
    timeWindow: 'Khung giờ',
    selectTimeWindow: 'Chọn khung giờ',
    noTimes: 'Chưa có khung giờ nào từ hệ thống.',
  },
  en: {
    cardTitle: 'Preferred flight schedule',
    dateRangeHint:
      'Choose the date range when you want the drone to fly. The earliest date must be tomorrow or later.',
    advanceNoticeTitle: 'Scheduling note: ',
    advanceNoticeBody:
      'For example, if today is 03/10, the earliest selectable date is 04/10.',
    startDate: 'Earliest date',
    endDate: 'Latest date',
    timeWindow: 'Time window',
    selectTimeWindow: 'Select a time window',
    noTimes: 'The system has no time windows yet.',
  },
})
