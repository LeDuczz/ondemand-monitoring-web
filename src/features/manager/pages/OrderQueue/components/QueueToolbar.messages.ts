import { defineMessages } from '../../../../../shared/i18n'

export const queueToolbarMessages = defineMessages({
  vi: {
    title: 'Bộ lọc hàng đợi',
    searchPlaceholder: 'Tìm mã đơn, khách hàng hoặc dịch vụ',
    searchAria: 'Tìm đơn hàng',
    filters: {
      ALL: 'Tất cả',
      OVERDUE: 'Quá 24 giờ',
      SOON: 'Bay trong 48 giờ',
    },
  },
  en: {
    title: 'Queue filter',
    searchPlaceholder: 'Search order, customer or service',
    searchAria: 'Search orders',
    filters: {
      ALL: 'All',
      OVERDUE: 'Over 24h',
      SOON: 'Within 48h',
    },
  },
})
