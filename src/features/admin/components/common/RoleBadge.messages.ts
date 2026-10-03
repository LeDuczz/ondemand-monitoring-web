import { defineMessages } from '../../../../shared/i18n'

export const roleBadgeMessages = defineMessages({
  vi: {
    labels: {
      ADMIN: 'Quản trị viên',
      STAFF: 'Nhân viên',
      MANAGER: 'Quản lý',
      CUSTOMER: 'Khách hàng',
    } as Record<string, string>,
  },
  en: {
    labels: {
      ADMIN: 'Administrator',
      STAFF: 'Staff',
      MANAGER: 'Manager',
      CUSTOMER: 'Customer',
    } as Record<string, string>,
  },
})
