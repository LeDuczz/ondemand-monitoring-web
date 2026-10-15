import { defineMessages } from '../../../../../shared/i18n'

export const resolveModalMessages = defineMessages({
  vi: {
    modalTitle: 'Cập nhật Báo cáo Sửa chữa',
    modalTicketPrefix: 'Ticket:',
    modalDronePrefix: 'Thiết bị:',
    notesLabel: 'Ghi chú & Chi tiết khắc phục sự cố *',
    notesPlaceholder:
      'Mô tả công việc kiểm tra, thay thế thiết bị hoặc thử nghiệm đã hoàn thành...',
    droneStatusLabel: 'Trạng thái thiết bị sau sửa chữa *',
    droneStatusOptions: {
      AVAILABLE: 'AVAILABLE — Sẵn sàng làm nhiệm vụ bay',
      IDLE_CHARGING: 'IDLE_CHARGING — Đưa vào trạm sạc pin',
      MAINTENANCE: 'MAINTENANCE — Tiếp tục bảo trì',
    },
    cancel: 'Hủy',
    processing: 'Đang xử lý...',
    confirmRestore: 'Xác nhận khôi phục thiết bị',
  },
  en: {
    modalTitle: 'Update Repair Report',
    modalTicketPrefix: 'Ticket:',
    modalDronePrefix: 'Device:',
    notesLabel: 'Repair details / notes *',
    notesPlaceholder:
      'Describe the inspection, part replacement, or tests completed...',
    droneStatusLabel: 'Device status after repair *',
    droneStatusOptions: {
      AVAILABLE: 'AVAILABLE — Ready for missions',
      IDLE_CHARGING: 'IDLE_CHARGING — Move to charging station',
      MAINTENANCE: 'MAINTENANCE — Keep under maintenance',
    },
    cancel: 'Cancel',
    processing: 'Processing...',
    confirmRestore: 'Confirm device restore',
  },
})
