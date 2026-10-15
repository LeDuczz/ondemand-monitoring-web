import { defineMessages } from '../../../../../shared/i18n'

export const queueTableMessages = defineMessages({
  vi: {
    columns: {
      order: 'Đơn hàng',
      service: 'Dịch vụ',
      schedule: 'Lịch mong muốn',
      age: 'Chờ',
      status: 'Trạng thái',
      actions: 'Thao tác',
    },
    review: 'Duyệt',
  },
  en: {
    columns: {
      order: 'Order',
      service: 'Service',
      schedule: 'Preferred schedule',
      age: 'Waiting',
      status: 'Status',
      actions: 'Actions',
    },
    review: 'Review',
  },
})
