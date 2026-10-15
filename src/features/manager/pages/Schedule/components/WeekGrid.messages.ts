import { defineMessages } from '../../../../../shared/i18n'

type Seven = [string, string, string, string, string, string, string]

export const weekGridMessages = defineMessages({
  vi: {
    weekGridAriaLabel: 'Lịch nhiệm vụ theo tuần',
    shortDays: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'] as Seven,
    legendAria: 'Chú giải trạng thái',
    legend: {
      warning: 'Chờ xử lý',
      info: 'Đang thực hiện',
      success: 'Sẵn sàng / hoàn tất',
      danger: 'Lỗi',
      neutral: 'Khác',
    },
  },
  en: {
    weekGridAriaLabel: 'Mission schedule by week',
    shortDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as Seven,
    legendAria: 'Status legend',
    legend: {
      warning: 'Pending',
      info: 'In progress',
      success: 'Ready / done',
      danger: 'Failed',
      neutral: 'Other',
    },
  },
})
