import { defineMessages } from '../../../../shared/i18n'

export const schedulePageMessages = defineMessages({
  vi: {
    pageAriaLabel: 'Lịch nhiệm vụ',
    missionCount: (n: number) => `${n} nhiệm vụ`,
  },
  en: {
    pageAriaLabel: 'Mission schedule',
    missionCount: (n: number) => `${n} mission${n === 1 ? '' : 's'}`,
  },
})
