import { defineMessages } from '../../../../shared/i18n'

export const requestDeliverablesMessages = defineMessages({
  vi: {
    mediaN: (n: number) => `Media ${n}`,
    noData: 'Chưa có dữ liệu',
    additionalRequirements: 'Yêu cầu bổ sung',
  },
  en: {
    mediaN: (n: number) => `Media ${n}`,
    noData: 'No data yet',
    additionalRequirements: 'Additional requirements',
  },
})
