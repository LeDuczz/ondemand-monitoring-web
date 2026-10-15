import { defineMessages } from '../../../../../shared/i18n'

export const approvedOrdersSectionMessages = defineMessages({
  vi: {
    title: (n: number) => `Đơn chờ lập kế hoạch (${n})`,
    action: 'Lập kế hoạch',
    actionAria: (code: string) => `Lập kế hoạch cho đơn ${code}`,
    showAll: (n: number) => `Xem tất cả (${n})`,
    showLess: 'Thu gọn',
  },
  en: {
    title: (n: number) => `Orders awaiting planning (${n})`,
    action: 'Plan',
    actionAria: (code: string) => `Plan mission for order ${code}`,
    showAll: (n: number) => `View all (${n})`,
    showLess: 'Show less',
  },
})
