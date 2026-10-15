import { defineMessages } from '../../../../../shared/i18n'

export const droneStatusDonutMessages = defineMessages({
  vi: {
    ariaLabel: (total: number, summary: string) =>
      `Trạng thái đội drone: ${total} drone. ${summary}.`,
    unit: 'drone',
    status: {
      AVAILABLE: 'Sẵn sàng',
      RESERVED: 'Đã giữ chỗ',
      PREFLIGHT: 'Kiểm tra trước bay',
      IN_MISSION: 'Đang làm nhiệm vụ',
      ACTIVE_MISSION: 'Đang làm nhiệm vụ',
      RETURNING: 'Đang quay về',
      CHARGING: 'Đang sạc',
      IDLE_CHARGING: 'Đang sạc',
      MAINTENANCE: 'Bảo trì',
      OUT_OF_SERVICE: 'Ngừng sử dụng',
      OFFLINE: 'Mất kết nối',
    },
  },
  en: {
    ariaLabel: (total: number, summary: string) =>
      `Drone fleet status: ${total} drones. ${summary}.`,
    unit: 'drones',
    status: {
      AVAILABLE: 'Available',
      RESERVED: 'Reserved',
      PREFLIGHT: 'Pre-flight check',
      IN_MISSION: 'On mission',
      ACTIVE_MISSION: 'On mission',
      RETURNING: 'Returning',
      CHARGING: 'Charging',
      IDLE_CHARGING: 'Charging',
      MAINTENANCE: 'Maintenance',
      OUT_OF_SERVICE: 'Out of service',
      OFFLINE: 'Offline',
    },
  },
})
