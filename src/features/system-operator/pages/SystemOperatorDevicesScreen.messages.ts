import { defineMessages } from '../../../shared/i18n'

export const systemOperatorDevicesScreenMessages = defineMessages({
  vi: {
    bannerTitle: 'Quản lý Trạng thái Fleet & Thiết bị Drone',
    bannerSubtitle:
      'Theo dõi tình trạng dung lượng pin, chất lượng sóng kết nối và lịch sử kiểm tra kỹ thuật.',
    filterAll: (count: number) => `Tất cả trạng thái (${count})`,
    statusLabels: {
      AVAILABLE: 'AVAILABLE — Sẵn sàng bay',
      IDLE_CHARGING: 'IDLE_CHARGING — Đang sạc pin',
      MAINTENANCE: 'MAINTENANCE — Đang bảo trì',
      IN_FLIGHT: 'IN_FLIGHT — Đang thực hiện sứ mệnh',
    },
    model: 'Model',
    batteryLevel: 'Dung lượng Pin',
    telemetrySignal: 'Sóng Telemetry',
    updated: 'Cập nhật',
    viewMaintenanceTicket: 'Xem ticket bảo trì →',
    justNow: 'Vừa xong',
    minutesAgo: (n: number) => `${n} phút trước`,
  },
  en: {
    bannerTitle: 'Fleet & Drone Device Status',
    bannerSubtitle:
      'Track battery level, connection signal quality and technical check history.',
    filterAll: (count: number) => `All statuses (${count})`,
    statusLabels: {
      AVAILABLE: 'AVAILABLE — Ready to fly',
      IDLE_CHARGING: 'IDLE_CHARGING — Charging',
      MAINTENANCE: 'MAINTENANCE — Under maintenance',
      IN_FLIGHT: 'IN_FLIGHT — On a mission',
    },
    model: 'Model',
    batteryLevel: 'Battery Level',
    telemetrySignal: 'Telemetry Signal',
    updated: 'Updated',
    viewMaintenanceTicket: 'View maintenance ticket →',
    justNow: 'Just now',
    minutesAgo: (n: number) => `${n} min ago`,
  },
})
