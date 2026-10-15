import { defineMessages } from '../../../../../shared/i18n'

export const maintenanceBannerMessages = defineMessages({
  vi: {
    foundFailures: (count: number) => `🚨 Phát hiện ${count} mục KHÔNG ĐẠT`,
    autoTicketNotePrefix: 'Hệ thống Backend sẽ',
    autoTicketNoteBold: 'tự động khởi tạo Ticket Bảo trì (Ticket Status: OPEN)',
    autoTicketNoteMid: 'cho thiết bị',
    autoTicketNoteSuffix: 'ngay khi bạn gửi báo cáo.',
    detailsAdded: '✓ Đã bổ sung chi tiết',
    addMaintenanceDetails: '✏️ Bổ sung mô tả bảo trì',
    allPassNotePrefix:
      '🟢 Tất cả các hạng mục đạt tiêu chuẩn. Thiết bị sẽ được chuyển trạng thái',
    allPassNoteBold: 'SẴN SÀNG (AVAILABLE)',
    allPassNoteSuffix: 'cho chuyến bay tiếp theo.',
  },
  en: {
    foundFailures: (count: number) => `🚨 ${count} item(s) FAILED`,
    autoTicketNotePrefix: 'The backend will',
    autoTicketNoteBold:
      'automatically open a maintenance ticket (status: OPEN)',
    autoTicketNoteMid: 'for device',
    autoTicketNoteSuffix: 'as soon as you submit the report.',
    detailsAdded: '✓ Details added',
    addMaintenanceDetails: '✏️ Add maintenance details',
    allPassNotePrefix: '🟢 All items meet standard. The device will move to',
    allPassNoteBold: 'AVAILABLE',
    allPassNoteSuffix: 'status for the next mission.',
  },
})
