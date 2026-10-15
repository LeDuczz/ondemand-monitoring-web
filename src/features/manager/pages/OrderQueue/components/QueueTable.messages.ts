import { defineMessages } from '../../../../../shared/i18n'

export const queueTableMessages = defineMessages({
  vi: {
    columns: {
      orderCode: 'Mã đơn',
      customer: 'Khách hàng',
      service: 'Dịch vụ',
      preferredDate: 'Ngày mong muốn',
    },
    review: 'Duyệt',
  },
  en: {
    columns: {
      orderCode: 'Order ID',
      customer: 'Customer',
      service: 'Service',
      preferredDate: 'Preferred date',
    },
    review: 'Review',
  },
})
