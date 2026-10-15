import { defineMessages } from '../../../../../shared/i18n'

export const ticketFilterBarMessages = defineMessages({
  vi: {
    page: {
      searchPlaceholder:
        'Tìm theo Mã Ticket, Mã Drone, Tiêu đề hoặc Operator...',
      priorityLabel: 'Mức độ:',
      priorityAll: 'Tất cả mức độ',
      assignedLabel: 'Phân công:',
      assignedAll: 'Tất cả trạng thái gán',
      assignedUnassigned: 'Chưa phân công',
      assignedAssigned: 'Đã phân công',
    },
    critical: 'Critical',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
  },
  en: {
    page: {
      searchPlaceholder:
        'Search by ticket code, drone code, title, or operator...',
      priorityLabel: 'Priority:',
      priorityAll: 'All priorities',
      assignedLabel: 'Assignment:',
      assignedAll: 'All assignment states',
      assignedUnassigned: 'Unassigned',
      assignedAssigned: 'Assigned',
    },
    critical: 'Critical',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
  },
})
