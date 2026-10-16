import { defineMessages } from '../../../shared/i18n'

export const queuePageMessages = defineMessages({
  vi: {
    title: 'Hàng đợi duyệt đơn',
    summary: (count: number, paid: number) => `${count} đơn chờ duyệt · ${paid} đơn chờ lập kế hoạch`,
    paid: {
      title: 'Đơn đã nhận cọc – chờ lập kế hoạch',
      description: 'Khách hàng đã thanh toán tiền đặt cọc. Manager có thể tạo Mission và phân công nguồn lực.',
      count: (count: number) => `${count} đơn sẵn sàng`,
      status: 'Trạng thái',
      depositReceived: 'Đã nhận cọc',
      action: 'Lập kế hoạch',
    },
    missionsToAssign: 'Mission chờ phân công',
    viewMissions: 'Xem nhiệm vụ đã tạo',
    refresh: 'Làm mới',
    loadError: 'Không tải được hàng đợi',
    emptyTitle: 'Không còn đơn chờ duyệt',
    emptyDescription:
      'Tuyệt vời. Khi khách gửi đơn mới, đơn sẽ xuất hiện ở đây. Các nhiệm vụ đã tạo có thể xem ở danh sách nhiệm vụ.',
    columns: {
      orderCode: 'Mã đơn',
      customer: 'Khách hàng',
      service: 'Dịch vụ',
      preferredDate: 'Ngày mong muốn',
    },
    review: 'Duyệt',
    loading: 'Đang tải…',
  },
  en: {
    title: 'Order review queue',
    summary: (count: number, paid: number) => `${count} pending review · ${paid} ready for planning`,
    paid: {
      title: 'Deposit received – planning queue',
      description: 'The customer has paid the deposit. A manager can now create Missions and assign resources.',
      count: (count: number) => `${count} ready`,
      status: 'Status',
      depositReceived: 'Deposit received',
      action: 'Plan execution',
    },
    missionsToAssign: 'Missions to assign',
    viewMissions: 'View created missions',
    refresh: 'Refresh',
    loadError: 'Could not load the queue',
    emptyTitle: 'No orders pending review',
    emptyDescription:
      'Nicely done. New orders will show up here as customers submit them.',
    columns: {
      orderCode: 'Order ID',
      customer: 'Customer',
      service: 'Service',
      preferredDate: 'Preferred date',
    },
    review: 'Review',
    loading: 'Loading…',
  },
})
