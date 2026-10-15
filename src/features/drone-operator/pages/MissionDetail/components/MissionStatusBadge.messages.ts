import { defineMessages } from '../../../../../shared/i18n'

export const missionStatusBadgeMessages = defineMessages({
  vi: {
    statusLabel: {
      PENDING_REVIEW: 'Chờ nghiệm thu',
      UNKNOWN: 'Trạng thái chưa hỗ trợ',
      PENDING: 'Chờ phản hồi',
      ACCEPTED: 'Đã nhận',
      IN_FLIGHT: 'Đang bay',
      COMPLETED: 'Hoàn thành',
      REJECTED: 'Bị từ chối',
      FAILED: 'Không hoàn thành',
    } as Record<string, string>,
  },
  en: {
    statusLabel: {
      PENDING_REVIEW: 'Pending review',
      UNKNOWN: 'Unsupported status',
      PENDING: 'Awaiting reply',
      ACCEPTED: 'Accepted',
      IN_FLIGHT: 'In flight',
      COMPLETED: 'Completed',
      REJECTED: 'Rejected',
      FAILED: 'Not completed',
    } as Record<string, string>,
  },
})
