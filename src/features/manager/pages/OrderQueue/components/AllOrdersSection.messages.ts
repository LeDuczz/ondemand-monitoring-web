import { defineMessages } from '../../../../../shared/i18n'

export const allOrdersSectionMessages = defineMessages({
  vi: {
    title: 'Tất cả đơn hàng',
    description:
      'Xem lại mọi đơn, kể cả đơn đã duyệt đang chờ khách đặt cọc, đang thực hiện hoặc đã hoàn tất.',
    filters: {
      ALL: 'Tất cả',
      APPROVED: 'Đã duyệt',
      IN_PROGRESS: 'Đang thực hiện',
      COMPLETED: 'Hoàn tất',
      NEEDS_INFO: 'Cần bổ sung',
      CLOSED: 'Từ chối / Hủy',
    } as Record<string, string>,
    columns: {
      order: 'Đơn hàng',
      service: 'Dịch vụ',
      schedule: 'Lịch mong muốn',
      status: 'Trạng thái',
      actions: 'Thao tác',
    },
    view: 'Xem',
    loading: 'Đang tải…',
    empty: 'Không có đơn nào trong nhóm này.',
    loadError: 'Không tải được danh sách đơn.',
  },
  en: {
    title: 'All orders',
    description:
      'Look back at every order, including approved orders waiting for the deposit, in progress or completed.',
    filters: {
      ALL: 'All',
      APPROVED: 'Approved',
      IN_PROGRESS: 'In progress',
      COMPLETED: 'Completed',
      NEEDS_INFO: 'Needs info',
      CLOSED: 'Rejected / Cancelled',
    } as Record<string, string>,
    columns: {
      order: 'Order',
      service: 'Service',
      schedule: 'Preferred schedule',
      status: 'Status',
      actions: 'Actions',
    },
    view: 'View',
    loading: 'Loading…',
    empty: 'No orders in this group.',
    loadError: 'Could not load the order list.',
  },
})
