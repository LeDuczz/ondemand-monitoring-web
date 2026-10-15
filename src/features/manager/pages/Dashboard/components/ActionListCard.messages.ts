import { defineMessages } from '../../../../../shared/i18n'

export const actionListCardMessages = defineMessages({
  vi: {
    actionListTitle: 'Cần xử lý ngay',
    clearFilter: 'Xoá lọc',
    actionTypeFilter: {
      ORDER_PENDING: 'Đơn chờ duyệt',
      MISSION_UNASSIGNED: 'Mission chưa phân công',
      MAINTENANCE_TICKET: 'Ticket bảo trì',
      MEDIA_ACTION: 'Media cần xử lý',
      MISSION_FLYING: 'Đang bay',
    },
    emptyListTitle: 'Không có việc cần xử lý',
    emptyListDescription:
      'Đơn chờ duyệt, mission chưa phân công và ticket nghiêm trọng sẽ hiện ở đây.',
    actionType: {
      ORDER_PENDING: 'Duyệt',
      MISSION_UNASSIGNED: 'Phân công',
      MAINTENANCE_TICKET: 'Xem ticket',
      MEDIA_ACTION: 'Xử lý',
      MISSION_FLYING: 'Giám sát',
    },
  },
  en: {
    actionListTitle: 'Needs attention now',
    clearFilter: 'Clear filter',
    actionTypeFilter: {
      ORDER_PENDING: 'Orders pending review',
      MISSION_UNASSIGNED: 'Unassigned missions',
      MAINTENANCE_TICKET: 'Maintenance tickets',
      MEDIA_ACTION: 'Media needing action',
      MISSION_FLYING: 'In flight',
    },
    emptyListTitle: 'Nothing needs attention',
    emptyListDescription:
      'Pending orders, unassigned missions, and critical tickets will show up here.',
    actionType: {
      ORDER_PENDING: 'Review',
      MISSION_UNASSIGNED: 'Assign',
      MAINTENANCE_TICKET: 'View ticket',
      MEDIA_ACTION: 'Handle',
      MISSION_FLYING: 'Monitor',
    },
  },
})
