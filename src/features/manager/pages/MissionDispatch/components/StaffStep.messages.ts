import { defineMessages } from '../../../../../shared/i18n'

export const staffStepMessages = defineMessages({
  vi: {
    step1: 'Phân công nhân sự',
    rolesComplete: 'Đã chọn đủ 4 vai trò',
    rolesMissing: (n: number) => `Thiếu ${n} vai trò`,
    roleHelp:
      'Chọn đủ 4 vai trò để có người phụ trách từng bước. Một nhân sự có thể kiêm nhiều vai trò nếu cần.',
    staffAvailabilityHint:
      'Chỉ hiển thị nhân sự khả dụng trong thời gian thực hiện Mission.',
    noAvailableOperators:
      'Không có nhân sự phù hợp trong khung giờ Mission này.',
  },
  en: {
    step1: 'Staff assignment',
    rolesComplete: 'All 4 roles selected',
    rolesMissing: (n: number) => `${n} role(s) still missing`,
    roleHelp:
      'Assign all 4 duties. One staff member can cover multiple roles when needed.',
    staffAvailabilityHint:
      'Only staff available during this Mission interval are shown.',
    noAvailableOperators:
      'No eligible staff are available during this Mission interval.',
  },
})
