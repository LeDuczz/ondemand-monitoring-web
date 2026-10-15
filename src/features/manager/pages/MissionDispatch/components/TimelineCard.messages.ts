import { defineMessages } from '../../../../../shared/i18n'

export const timelineCardMessages = defineMessages({
  vi: {
    timelineHeader: (date: string, start: string, end: string) =>
      `Timeline ngày ${date} · Khung mission này (${start}–${end})`,
    conflict: ' · trùng',
  },
  en: {
    timelineHeader: (date: string, start: string, end: string) =>
      `Timeline for ${date} · This mission's window (${start}–${end})`,
    conflict: ' · conflict',
  },
})
