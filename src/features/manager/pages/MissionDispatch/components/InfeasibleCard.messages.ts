import { defineMessages } from '../../../../../shared/i18n'

export const infeasibleCardMessages = defineMessages({
  vi: {
    noEligibleDrones: 'Không có drone đủ điều kiện',
    alternativeDays: 'Ngày thay thế',
    dronesFree: (n: number) => `${n} drone rảnh`,
    operatorsFree: (n: number) => `${n} phi công rảnh`,
  },
  en: {
    noEligibleDrones: 'No eligible drones',
    alternativeDays: 'Alternative days',
    dronesFree: (n: number) => `${n} drones free`,
    operatorsFree: (n: number) => `${n} operators free`,
  },
})
