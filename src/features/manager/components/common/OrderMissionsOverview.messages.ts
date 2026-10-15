import { defineMessages } from '../../../../shared/i18n'

export const orderMissionsOverviewMessages = defineMessages({
  vi: {
    title: 'Tổng quan Mission',
    subtitle:
      'Kiểm tra lại lịch, nhân sự và thiết bị của toàn bộ Mission trước khi hoàn tất.',
    reload: 'Làm mới',
    ariaLabel: 'Tổng quan Mission',
    assignedCount: (done: number, total: number) =>
      `${done}/${total} Mission đã phân công đầy đủ`,
    ready: 'Sẵn sàng',
    incomplete: 'Còn thiếu phân công',
    loading: 'Đang tải nhiệm vụ…',
    deviceAssigned: 'Thiết bị đã phân công',
    cancelled: 'Đã hủy',
    assigned: 'Đã phân công',
    schedule: 'Lịch',
    device: 'Thiết bị',
    assignMore: 'Phân công tiếp',
    hintAllReady: 'Tất cả Mission đã đủ nhân sự và thiết bị.',
    hintIncomplete:
      'Hoàn tất phân công các Mission còn thiếu để kết thúc kế hoạch.',
  },
  en: {
    title: 'Mission overview',
    subtitle:
      'Double-check the schedule, staff and device of every Mission before finishing.',
    reload: 'Refresh',
    ariaLabel: 'Mission overview',
    assignedCount: (done: number, total: number) =>
      `${done}/${total} Missions fully assigned`,
    ready: 'Ready',
    incomplete: 'Assignments missing',
    loading: 'Loading missions…',
    deviceAssigned: 'Device assigned',
    cancelled: 'Cancelled',
    assigned: 'Assigned',
    schedule: 'Schedule',
    device: 'Device',
    assignMore: 'Continue assigning',
    hintAllReady: 'Every Mission has its staff and device.',
    hintIncomplete:
      'Finish assigning the remaining Missions to complete the plan.',
  },
})
