import { defineMessages } from '../../../../shared/i18n'

export const missionListMessages = defineMessages({
  vi: {
    title: 'Nhiệm vụ của tôi',
    description:
      'Theo dõi, xem xét và quản lý các nhiệm vụ giám sát được giao.',
    searchPlaceholder: 'Tìm kiếm nhiệm vụ',
    alertPrefix: (count: number) => `${count} nhiệm vụ`,
    alertSuffix: (count: number) =>
      `${count === 1 ? 'yêu cầu' : 'yêu cầu'} bạn phản hồi. Xem xét và chấp nhận trước giờ khởi hành theo lịch.`,
    summary: {
      awaitingAcceptance: 'Chờ chấp nhận',
      scheduledToday: 'Lịch trình hôm nay',
      inFlight: 'Đang bay',
      completedToday: 'Hoàn thành hôm nay',
    },
    tableHeaders: {
      mission: 'Nhiệm vụ',
      customer: 'Khách hàng',
      drone: 'Drone',
      scheduled: 'Lịch trình',
      status: 'Trạng thái',
      priority: 'Ưu tiên',
      action: 'Hành động',
    },
    review: 'Xem xét',
  },
  en: {
    title: 'My missions',
    description: 'Track, review and manage your assigned monitoring missions.',
    searchPlaceholder: 'Search missions',
    alertPrefix: (count: number) => `${count} mission${count > 1 ? 's' : ''}`,
    alertSuffix: (count: number) =>
      `require${count === 1 ? 's' : ''} your response. Review and accept before the scheduled launch.`,
    summary: {
      awaitingAcceptance: 'Awaiting acceptance',
      scheduledToday: 'Scheduled today',
      inFlight: 'In flight',
      completedToday: 'Completed today',
    },
    tableHeaders: {
      mission: 'Mission',
      customer: 'Customer',
      drone: 'Drone',
      scheduled: 'Scheduled',
      status: 'Status',
      priority: 'Priority',
      action: 'Action',
    },
    review: 'Review',
  },
})
