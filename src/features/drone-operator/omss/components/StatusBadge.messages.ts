import { defineMessages } from '../../../../shared/i18n'

export const statusBadgeMessages = defineMessages({
  vi: {
    check: {
      PASS: 'Đạt',
      FAIL: 'Thất bại',
      WARNING: 'Cảnh báo',
      PENDING: 'Đang chờ',
    },
    priority: {
      CRITICAL: 'Khẩn cấp',
      HIGH: 'Cao',
      NORMAL: 'Bình thường',
      LOW: 'Thấp',
    },
  },
  en: {
    check: {
      PASS: 'Passed',
      FAIL: 'Failed',
      WARNING: 'Warning',
      PENDING: 'Pending',
    },
    priority: {
      CRITICAL: 'Critical',
      HIGH: 'High',
      NORMAL: 'Normal',
      LOW: 'Low',
    },
  },
})
