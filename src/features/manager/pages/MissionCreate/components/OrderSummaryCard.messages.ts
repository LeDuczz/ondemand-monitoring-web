import { defineMessages } from '../../../../../shared/i18n'

export const orderSummaryCardMessages = defineMessages({
  vi: {
    orderSummary: 'Tóm tắt đơn hàng',
    mediaLabel: 'Yêu cầu media',
    serviceLabel: 'Dịch vụ',
    customerLabel: 'Khách hàng',
    locationLabel: 'Địa điểm',
    radiusLabel: 'Bán kính giám sát',
    nearestBaseLabel: 'Trạm gần nhất',
    unit: {
      items: (n: number) => `${n} mục`,
    },
  },
  en: {
    orderSummary: 'Order summary',
    mediaLabel: 'Media requirements',
    serviceLabel: 'Service',
    customerLabel: 'Customer',
    locationLabel: 'Location',
    radiusLabel: 'Monitoring radius',
    nearestBaseLabel: 'Nearest base',
    unit: {
      items: (n: number) => `${n} items`,
    },
  },
})
