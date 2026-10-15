import { defineMessages } from '../../../../../shared/i18n'

export const operatorCardMessages = defineMessages({
  vi: {
    candidate: {
      whySuggested: 'Vì sao gợi ý',
      validUntil: (date: string) => `còn hạn đến ${date}`,
      missionsWithModel: 'Mission với model này',
      successRate: 'Tỉ lệ thành công',
      acceptanceRate: 'Tỉ lệ nhận việc',
      missionsThisWeek: 'Mission trong tuần',
      selected: 'Đã chọn',
      selectThisOperator: 'Chọn phi công này',
    },
  },
  en: {
    candidate: {
      whySuggested: 'Why suggested',
      validUntil: (date: string) => `valid until ${date}`,
      missionsWithModel: 'Missions with this model',
      successRate: 'Success rate',
      acceptanceRate: 'Acceptance rate',
      missionsThisWeek: 'Missions this week',
      selected: 'Selected',
      selectThisOperator: 'Select this pilot',
    },
  },
})
