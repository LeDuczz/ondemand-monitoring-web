import { defineMessages } from '../../../../../shared/i18n'

export const staffRoleCardMessages = defineMessages({
  vi: {
    roles: {
      PILOT: 'Phi công',
      OPERATOR: 'Vận hành',
      MAINTAINER: 'Bảo trì',
      INSPECTOR: 'Nghiệm thu',
    },
    roleDescriptions: {
      PILOT: 'Điều khiển bay',
      OPERATOR: 'Kết nối thiết bị và kiểm tra trước bay',
      MAINTAINER: 'Kiểm tra thiết bị sau bay',
      INSPECTOR: 'Nghiệm thu kết quả và tệp ghi nhận',
    },
  },
  en: {
    roles: {
      PILOT: 'Pilot',
      OPERATOR: 'Operator',
      MAINTAINER: 'Maintainer',
      INSPECTOR: 'Inspector',
    },
    roleDescriptions: {
      PILOT: 'Flight control',
      OPERATOR: 'Device connection and preflight',
      MAINTAINER: 'Postflight device check',
      INSPECTOR: 'Result/media review',
    },
  },
})
