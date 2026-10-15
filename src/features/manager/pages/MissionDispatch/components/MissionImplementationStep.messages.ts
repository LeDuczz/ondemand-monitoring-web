import { defineMessages } from '../../../../../shared/i18n'

export const missionImplementationStepMessages = defineMessages({
  vi: {
    missionImplementation: 'Nhiệm vụ triển khai',
    missionHeader: (code: string) => `Nhiệm vụ ${code}`,
    status: 'Trạng thái',
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
    actualSchedule: 'Lịch bay nhân sự chọn',
  },
  en: {
    missionImplementation: 'Mission implementation',
    missionHeader: (code: string) => `Mission ${code}`,
    status: 'Status',
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
    actualSchedule: 'Staff-selected flight schedule',
  },
})
