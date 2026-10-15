import { defineMessages } from '../../../../../shared/i18n'

export const managerNoteCardMessages = defineMessages({
  vi: {
    managerNotePrefix: 'Ghi chú của quản lý',
    respondBefore: (date: string, time: string) =>
      `Hãy phản hồi trước ${date} ${time}`,
  },
  en: {
    managerNotePrefix: "Manager's note",
    respondBefore: (date: string, time: string) =>
      `Please respond by ${date} ${time}`,
  },
})
