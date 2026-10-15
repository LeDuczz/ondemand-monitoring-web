import { defineMessages } from '../../../../shared/i18n'

export const missionDetailHelpersMessages = defineMessages({
  vi: {
    durationSeconds: (s: number) => `${s} giây`,
    durationMinutes: (m: number) => `${m} phút`,
    durationMinSec: (m: number, s: number) => `${m} phút ${s} giây`,
    checkLabels: {
      PASSED: 'Đạt',
      FAILED: 'Không đạt',
      PENDING: 'Chờ kiểm tra',
      CHECKING: 'Đang kiểm tra',
      CANCELLED: 'Đã hủy',
      COMPLETED: 'Hoàn thành',
      IN_PROGRESS: 'Đang xử lý',
      DRAFT: 'Nháp',
      PENDING_MANAGER_APPROVAL: 'Chờ duyệt',
      APPROVED: 'Đã duyệt',
      REJECTED: 'Từ chối',
    } as Record<string, string>,
    staffRoles: {
      PILOT: 'Phi công',
      OPERATOR: 'Vận hành',
      MAINTAINER: 'Bảo trì',
      INSPECTOR: 'Nghiệm thu',
    },
    staffResponses: {
      PENDING: 'Chờ phản hồi',
      ACCEPTED: 'Đã chấp nhận',
      REJECTED: 'Đã từ chối',
    },
  },
  en: {
    durationSeconds: (s: number) => `${s} sec`,
    durationMinutes: (m: number) => `${m} min`,
    durationMinSec: (m: number, s: number) => `${m} min ${s} sec`,
    checkLabels: {
      PASSED: 'Passed',
      FAILED: 'Failed',
      PENDING: 'Pending check',
      CHECKING: 'Checking',
      CANCELLED: 'Cancelled',
      COMPLETED: 'Completed',
      IN_PROGRESS: 'In progress',
      DRAFT: 'Draft',
      PENDING_MANAGER_APPROVAL: 'Awaiting approval',
      APPROVED: 'Approved',
      REJECTED: 'Rejected',
    } as Record<string, string>,
    staffRoles: {
      PILOT: 'Pilot',
      OPERATOR: 'Operator',
      MAINTAINER: 'Maintainer',
      INSPECTOR: 'Inspector',
    },
    staffResponses: {
      PENDING: 'Awaiting response',
      ACCEPTED: 'Accepted',
      REJECTED: 'Declined',
    },
  },
})
