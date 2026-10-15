import { defineMessages } from '../../../../../shared/i18n'

export const queueSummaryHeaderMessages = defineMessages({
  vi: {
    title: 'Hàng đợi duyệt đơn',
    summary: (count: number) => `${count} đơn đang chờ`,
    viewMissions: 'Xem nhiệm vụ đã tạo',
    refresh: 'Làm mới',
  },
  en: {
    title: 'Order review queue',
    summary: (count: number) => `${count} orders pending`,
    viewMissions: 'View created missions',
    refresh: 'Refresh',
  },
})
