import { defineMessages } from '../../../../../shared/i18n'

export const missionCreateHeaderMessages = defineMessages({
  vi: {
    title: 'Tạo nhiệm vụ',
    fromOrder: (code: string, service: string, customer: string) =>
      `Từ đơn ${code} · ${service} · ${customer}`,
  },
  en: {
    title: 'Create mission',
    fromOrder: (code: string, service: string, customer: string) =>
      `From order ${code} · ${service} · ${customer}`,
  },
})
