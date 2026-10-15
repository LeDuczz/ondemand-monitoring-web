import { defineMessages } from '../../../../shared/i18n'

export const maintenancePageMessages = defineMessages({
  vi: {
    title: 'Quản lý Ticket & Phân công Bảo trì',
    ticketCount: (n: number) => `${n} ticket`,
    createButton: '+ Tạo ticket',
  },
  en: {
    title: 'Maintenance ticket & assignment management',
    ticketCount: (n: number) => `${n} ticket${n === 1 ? '' : 's'}`,
    createButton: '+ New ticket',
  },
})
