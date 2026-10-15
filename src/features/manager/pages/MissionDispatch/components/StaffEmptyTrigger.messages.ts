import { defineMessages } from '../../../../../shared/i18n'

export const staffEmptyTriggerMessages = defineMessages({
  vi: {
    chooseOperatorAria: (role: string) => `Chọn nhân sự cho ${role}`,
    roles: {
      PILOT: 'Phi công',
      OPERATOR: 'Vận hành',
      MAINTAINER: 'Bảo trì',
      INSPECTOR: 'Nghiệm thu',
    },
    chooseStaff: 'Chọn nhân sự',
  },
  en: {
    chooseOperatorAria: (role: string) => `Choose staff for ${role}`,
    roles: {
      PILOT: 'Pilot',
      OPERATOR: 'Operator',
      MAINTAINER: 'Maintainer',
      INSPECTOR: 'Inspector',
    },
    chooseStaff: 'Choose staff',
  },
})
