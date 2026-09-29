import { defineMessages } from '../../../../../shared/i18n'

export const ordersPagerMessages = defineMessages({
  vi: {
    total: (n: number) => `Tổng ${n} đơn`,
    page: (page: number, pages: number) => `Trang ${page} / ${pages}`,
    prev: 'Trước',
    next: 'Sau',
  },
  en: {
    total: (n: number) => `${n} orders in total`,
    page: (page: number, pages: number) => `Page ${page} of ${pages}`,
    prev: 'Previous',
    next: 'Next',
  },
})
