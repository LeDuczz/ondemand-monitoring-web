import { defineMessages } from '../../../../../shared/i18n'

export const missionListTableMessages = defineMessages({
  vi: {
    emptyTitle: 'Không có mission',
    emptyBody: 'Không tìm thấy mission phù hợp.',
    columns: {
      code: 'Mã mission',
      job: 'Công việc',
      time: 'Thời gian',
      service: 'Dịch vụ',
      drone: 'Thiết bị',
      status: 'Trạng thái',
      managerSubmission: 'Gửi manager',
      deadline: 'Thời hạn',
    },
  },
  en: {
    emptyTitle: 'No missions',
    emptyBody: 'No matching missions found.',
    columns: {
      code: 'Mission code',
      job: 'Job',
      time: 'Time',
      service: 'Service',
      drone: 'Device',
      status: 'Status',
      managerSubmission: 'Manager send',
      deadline: 'Deadline',
    },
  },
})
