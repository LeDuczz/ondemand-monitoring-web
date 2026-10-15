import { defineMessages } from '../../../../../shared/i18n'

export const liveTopBarMessages = defineMessages({
  vi: {
    scheduledPrefix: (start: string, end: string) =>
      ` · ${start} → dự kiến ${end}`,
    recordIncident: 'Ghi nhận sự cố',
    urgentCancel: 'Huỷ mission khẩn',
  },
  en: {
    scheduledPrefix: (start: string, end: string) =>
      ` · ${start} → expected ${end}`,
    recordIncident: 'Report incident',
    urgentCancel: 'Emergency cancel',
  },
})
