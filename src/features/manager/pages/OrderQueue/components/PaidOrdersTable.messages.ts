import { defineMessages } from '../../../../../shared/i18n'

export const paidOrdersTableMessages = defineMessages({
  vi: {
    title: 'Đơn đã nhận cọc – chờ lập kế hoạch',
    description:
      'Khách hàng đã thanh toán tiền đặt cọc. Manager có thể tạo Mission và phân công nguồn lực.',
    count: (count: number) => `${count} đơn sẵn sàng`,
    columns: {
      order: 'Đơn hàng',
      service: 'Dịch vụ',
      schedule: 'Lịch mong muốn',
      status: 'Trạng thái',
      actions: 'Thao tác',
    },
    depositReceived: 'Đã nhận cọc',
    action: 'Lập kế hoạch',
  },
  en: {
    title: 'Deposit received – planning queue',
    description:
      'The customer has paid the deposit. A manager can now create Missions and assign resources.',
    count: (count: number) => `${count} ready`,
    columns: {
      order: 'Order',
      service: 'Service',
      schedule: 'Preferred schedule',
      status: 'Status',
      actions: 'Actions',
    },
    depositReceived: 'Deposit received',
    action: 'Plan execution',
  },
})
