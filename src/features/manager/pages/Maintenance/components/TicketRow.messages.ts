import { defineMessages } from '../../../../../shared/i18n'

export const ticketRowMessages = defineMessages({
  vi: {
    age: {
      daysAgo: (days: number) => `${days} ngày trước`,
      hoursAgo: (hours: number) => `${hours} giờ trước`,
      justNow: 'Vừa tạo',
    },
    unassigned: 'Chưa phân công',
    changeOperator: 'Đổi operator',
    assignOperator: 'Phân công',
  },
  en: {
    age: {
      daysAgo: (days: number) => `${days} day${days === 1 ? '' : 's'} ago`,
      hoursAgo: (hours: number) => `${hours} hour${hours === 1 ? '' : 's'} ago`,
      justNow: 'Just now',
    },
    unassigned: 'Unassigned',
    changeOperator: 'Change operator',
    assignOperator: 'Assign',
  },
})
