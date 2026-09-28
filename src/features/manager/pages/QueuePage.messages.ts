import { defineMessages } from '../../../shared/i18n'

export const queuePageMessages = defineMessages({
  vi: {
    sortOptions: {
      longestWait: 'Chờ lâu nhất',
      preferredDateAsc: 'Ngày mong muốn gần nhất',
    },
    title: 'Hàng đợi duyệt đơn',
    summary: (count: number, overdueCount: number) =>
      `${count} đơn đang chờ · ${overdueCount} đơn quá 24 giờ`,
    missionsToAssign: 'Mission chờ phân công',
    refresh: 'Làm mới',
    loadError: 'Không tải được hàng đợi',
    emptyTitle: 'Không còn đơn chờ duyệt',
    emptyDescription:
      'Tuyệt vời. Khi khách gửi đơn mới, đơn sẽ xuất hiện ở đây.',
    sort: 'Sắp xếp',
    columns: {
      orderCode: 'Mã đơn',
      customer: 'Khách hàng',
      service: 'Dịch vụ',
      preferredDate: 'Ngày mong muốn',
      waitTime: 'Thời gian chờ',
    },
    review: 'Duyệt',
    loading: 'Đang tải…',
  },
  en: {
    sortOptions: {
      longestWait: 'Longest wait',
      preferredDateAsc: 'Preferred date (soonest)',
    },
    title: 'Order review queue',
    summary: (count: number, overdueCount: number) =>
      `${count} orders pending · ${overdueCount} orders over 24h`,
    missionsToAssign: 'Missions to assign',
    refresh: 'Refresh',
    loadError: 'Could not load the queue',
    emptyTitle: 'No orders pending review',
    emptyDescription:
      'Nicely done. New orders will show up here as customers submit them.',
    sort: 'Sort',
    columns: {
      orderCode: 'Order ID',
      customer: 'Customer',
      service: 'Service',
      preferredDate: 'Preferred date',
      waitTime: 'Wait time',
    },
    review: 'Review',
    loading: 'Loading…',
  },
})
