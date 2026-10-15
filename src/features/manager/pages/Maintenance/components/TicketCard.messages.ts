import { defineMessages } from '../../../../../shared/i18n'

export const ticketCardMessages = defineMessages({
  vi: {
    age: {
      daysAgo: (days: number) => `${days} ngày trước`,
      hoursAgo: (hours: number) => `${hours} giờ trước`,
      justNow: 'Vừa tạo',
    },
    card: {
      operatorLabel: 'Operator: ',
      unassigned: 'Chưa phân công',
      changeOperator: 'Đổi System Operator',
      assignOperator: 'Phân công System Operator',
      resolved: 'Đã được khắc phục xong',
    },
  },
  en: {
    age: {
      daysAgo: (days: number) => `${days} day${days === 1 ? '' : 's'} ago`,
      hoursAgo: (hours: number) => `${hours} hour${hours === 1 ? '' : 's'} ago`,
      justNow: 'Just now',
    },
    card: {
      operatorLabel: 'Operator: ',
      unassigned: 'Unassigned',
      changeOperator: 'Change operator',
      assignOperator: 'Assign operator',
      resolved: 'Resolved',
    },
  },
})
