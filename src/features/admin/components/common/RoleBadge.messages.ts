import { defineMessages } from '../../../../shared/i18n'

export const roleBadgeMessages = defineMessages({
  vi: {
    labels: {
      ADMIN: 'Quản trị viên',
      SYSTEM_OPERATOR: 'Vận hành hệ thống',
      DRONE_OPERATOR: 'Phi công drone',
      STAFF: 'Nhân viên điều hành',
      CUSTOMER: 'Khách hàng',
    } as Record<string, string>,
  },
  en: {
    labels: {
      ADMIN: 'Administrator',
      SYSTEM_OPERATOR: 'System operator',
      DRONE_OPERATOR: 'Drone operator',
      STAFF: 'Operations staff',
      CUSTOMER: 'Customer',
    } as Record<string, string>,
  },
})
