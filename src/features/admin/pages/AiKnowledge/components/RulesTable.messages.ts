import { defineMessages } from '../../../../../shared/i18n'

export const rulesTableMessages = defineMessages({
  vi: {
    code: 'Mã',
    ruleName: 'Tên luật',
    type: 'Loại',
    severity: 'Mức độ',
    weight: 'Trọng số',
    status: 'Trạng thái',
    actions: 'Thao tác',
    on: 'Bật',
    off: 'Tắt',
    save: 'Lưu',
    categories: {
      SCHEDULE: 'Lịch trình',
      GEO: 'Địa lý',
      CAPABILITY: 'Năng lực',
      SAFETY: 'An toàn',
    },
    severities: {
      BLOCKER: 'Chặn',
      WARNING: 'Cảnh báo',
      INFO: 'Thông tin',
    },
  },
  en: {
    code: 'Code',
    ruleName: 'Rule name',
    type: 'Type',
    severity: 'Severity',
    weight: 'Weight',
    status: 'Status',
    actions: 'Actions',
    on: 'On',
    off: 'Off',
    save: 'Save',
    categories: {
      SCHEDULE: 'Schedule',
      GEO: 'Geo',
      CAPABILITY: 'Capability',
      SAFETY: 'Safety',
    },
    severities: {
      BLOCKER: 'Blocker',
      WARNING: 'Warning',
      INFO: 'Info',
    },
  },
})
