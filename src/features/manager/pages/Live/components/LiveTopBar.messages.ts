import { defineMessages } from '../../../../../shared/i18n'

export const liveTopBarMessages = defineMessages({
  vi: {
    scheduledPrefix: (start: string, end: string) =>
      ` · ${start} → dự kiến ${end}`,
  },
  en: {
    scheduledPrefix: (start: string, end: string) =>
      ` · ${start} → expected ${end}`,
  },
})
