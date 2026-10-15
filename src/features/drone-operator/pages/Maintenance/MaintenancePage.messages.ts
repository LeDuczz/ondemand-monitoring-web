import { defineMessages } from '../../../../shared/i18n'

export const maintenancePageMessages = defineMessages({
  vi: {
    notesRequiredError: 'Vui lòng nhập chi tiết công việc sửa chữa/khắc phục.',
    resolveSuccess: (ticketCode: string, deviceId: string, status: string) =>
      `Đã hoàn tất bảo trì cho Ticket ${ticketCode}. Thiết bị ${deviceId} đã chuyển về ${status}!`,
    resolveFailed: 'Không thể lưu thông tin bảo trì',
  },
  en: {
    notesRequiredError: 'Please enter details of the repair/fix work.',
    resolveSuccess: (ticketCode: string, deviceId: string, status: string) =>
      `Maintenance completed for ticket ${ticketCode}. Device ${deviceId} moved to ${status}!`,
    resolveFailed: 'Could not save the maintenance information',
  },
})
