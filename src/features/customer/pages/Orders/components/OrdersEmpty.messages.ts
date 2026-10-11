import { defineMessages } from '../../../../../shared/i18n'

export const ordersEmptyMessages = defineMessages({
  vi: {
    emptyTitle: 'Chưa có đơn hàng',
    noMatchTitle: 'Không tìm thấy đơn phù hợp',
    emptyAll: 'Bạn chưa gửi yêu cầu giám sát nào.',
    emptyFiltered: 'Không có đơn nào khớp bộ lọc hiện tại.',
    createFirst: 'Tạo yêu cầu giám sát',
    clearFilters: 'Xoá bộ lọc',
  },
  en: {
    emptyTitle: 'No orders',
    noMatchTitle: 'No matching orders',
    emptyAll: "You haven't submitted any monitoring request yet.",
    emptyFiltered: 'No orders match the current filters.',
    createFirst: 'Create a monitoring request',
    clearFilters: 'Clear filters',
  },
})
