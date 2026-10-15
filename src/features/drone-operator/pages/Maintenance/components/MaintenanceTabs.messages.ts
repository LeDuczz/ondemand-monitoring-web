import { defineMessages } from '../../../../../shared/i18n'

export const maintenanceTabsMessages = defineMessages({
  vi: {
    tabMine: (count: number) => `Đã gán cho tôi (${count})`,
    tabAllActive: (count: number) => `Tất cả Ticket đang mở (${count})`,
    tabResolved: (count: number) => `Đã hoàn tất (${count})`,
  },
  en: {
    tabMine: (count: number) => `Assigned to me (${count})`,
    tabAllActive: (count: number) => `All open tickets (${count})`,
    tabResolved: (count: number) => `Resolved (${count})`,
  },
})
