import { defineMessages } from '../../../../../shared/i18n'

export const scoreRingMessages = defineMessages({
  vi: {
    scoreAria: (score: number) => `Điểm ${score}/100`,
  },
  en: {
    scoreAria: (score: number) => `Score ${score}/100`,
  },
})
