import { defineMessages } from '../../../../../shared/i18n'

export const missionCreateHeaderMessages = defineMessages({
  vi: {
    back: '← Xem kế hoạch Order',
    title: 'Tạo nhiệm vụ',
    fromOrder: (code: string, service: string, customer: string) =>
      `Từ đơn ${code} · ${service} · ${customer}`,
  },
  en: {
    back: '← View Order plan',
    title: 'Create mission',
    fromOrder: (code: string, service: string, customer: string) =>
      `From order ${code} · ${service} · ${customer}`,
  },
})
