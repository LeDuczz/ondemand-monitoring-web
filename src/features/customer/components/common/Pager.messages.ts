import { defineMessages } from '../../../../shared/i18n'

export const pagerMessages = defineMessages({
  vi: {
    total: (n: number, unit: string) => `${n} ${unit}`,
    page: (page: number, total: number) => `Trang ${page} / ${total}`,
    prev: 'Trang trước',
    next: 'Trang sau',
  },
  en: {
    total: (n: number, unit: string) => `${n} ${unit}`,
    page: (page: number, total: number) => `Page ${page} of ${total}`,
    prev: 'Previous',
    next: 'Next',
  },
})
