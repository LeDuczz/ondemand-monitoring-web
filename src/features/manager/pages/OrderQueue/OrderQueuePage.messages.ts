import { defineMessages } from '../../../../shared/i18n'

export const orderQueuePageMessages = defineMessages({
  vi: {
    title: 'Hàng đợi duyệt đơn',
    summary: (count: number, paid: number) =>
      `${count} đơn chờ duyệt · ${paid} đơn chờ lập kế hoạch`,
    viewMissions: 'Xem nhiệm vụ đã tạo',
    refresh: 'Làm mới',
    loadError: 'Không tải được hàng đợi',
    noMatchTitle: 'Không có đơn phù hợp',
    noMatchDescription: 'Không có đơn nào khớp bộ lọc hoặc từ khoá này.',
  },
  en: {
    title: 'Order review queue',
    summary: (count: number, paid: number) =>
      `${count} pending review · ${paid} ready for planning`,
    viewMissions: 'View created missions',
    refresh: 'Refresh',
    loadError: 'Could not load the queue',
    noMatchTitle: 'No matching orders',
    noMatchDescription: 'No orders match this filter or search.',
  },
})
