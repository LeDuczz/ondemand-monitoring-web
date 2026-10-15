import { defineMessages } from '../../../../../shared/i18n'

export const assignedResultMessages = defineMessages({
  vi: {
    assignedTitle: 'Đã phân công nguồn lực',
    assignedBody: (code: string, status: string) =>
      `Nhiệm vụ ${code} hiện ở trạng thái “${status}”.`,
    missionStatuses: {
      CREATED: 'Đã tạo',
      RESOURCE_ASSIGNING: 'Đang phân công nguồn lực',
      WAITING_CREW_CONFIRMATION: 'Chờ đội bay xác nhận',
      READY: 'Sẵn sàng bay',
      IN_PROGRESS: 'Đang thực hiện',
      COMPLETED: 'Hoàn thành',
      CANCELLED: 'Đã hủy',
      REJECTED: 'Đã từ chối',
    },
    scheduleLabel: 'Lịch bay',
    assignedDevice: 'Thiết bị đã gán',
    backToOrders: 'Về danh sách đơn hàng',
    viewMission: 'Xem nhiệm vụ',
  },
  en: {
    assignedTitle: 'Resources assigned',
    assignedBody: (code: string, status: string) =>
      `Mission ${code} is now “${status}”.`,
    missionStatuses: {
      CREATED: 'Created',
      RESOURCE_ASSIGNING: 'Assigning resources',
      WAITING_CREW_CONFIRMATION: 'Waiting for crew confirmation',
      READY: 'Ready',
      IN_PROGRESS: 'In progress',
      COMPLETED: 'Completed',
      CANCELLED: 'Cancelled',
      REJECTED: 'Rejected',
    },
    scheduleLabel: 'Flight schedule',
    assignedDevice: 'Assigned devices',
    backToOrders: 'Back to orders',
    viewMission: 'View mission',
  },
})
