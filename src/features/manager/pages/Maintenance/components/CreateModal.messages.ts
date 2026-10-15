import { defineMessages } from '../../../../../shared/i18n'

export const createModalMessages = defineMessages({
  vi: {
    createModal: {
      title: 'Tạo Ticket Bảo trì mới',
      droneId: 'Mã/ID Drone *',
      droneIdPlaceholder: 'VD: d0000000-0000-0000-0000-000000000001',
      issueTitle: 'Tiêu đề sự cố *',
      issueTitlePlaceholder: 'Mô tả ngắn gọn sự cố...',
      priority: 'Mức độ ưu tiên',
      issueType: 'Loại sự cố',
      issueTypePlaceholder: 'VD: MOTOR_VIBRATION / BATTERY_DEGRADED',
      description: 'Mô tả chi tiết',
      descriptionPlaceholder: 'Chi tiết dấu hiệu hoặc lý do tạo ticket...',
      unknownError: 'Lỗi không xác định',
      cancel: 'Hủy',
      creating: 'Đang tạo...',
      create: 'Tạo Ticket',
    },
  },
  en: {
    createModal: {
      title: 'Create a new maintenance ticket',
      droneId: 'Drone ID *',
      droneIdPlaceholder: 'e.g. d0000000-0000-0000-0000-000000000001',
      issueTitle: 'Issue title *',
      issueTitlePlaceholder: 'Briefly describe the issue...',
      priority: 'Priority',
      issueType: 'Issue type',
      issueTypePlaceholder: 'e.g. MOTOR_VIBRATION / BATTERY_DEGRADED',
      description: 'Description',
      descriptionPlaceholder: 'Details or reason for opening this ticket...',
      unknownError: 'Unknown error',
      cancel: 'Cancel',
      creating: 'Creating...',
      create: 'Create ticket',
    },
  },
})
