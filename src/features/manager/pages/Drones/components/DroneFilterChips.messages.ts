import { defineMessages } from '../../../../../shared/i18n'

export const droneFilterChipsMessages = defineMessages({
  vi: {
    title: 'Trạng thái drone',
    searchPlaceholder: 'Tìm số serial, model hoặc payload',
    searchAria: 'Tìm drone',
    filters: {
      ALL: 'Tất cả',
      AVAILABLE: 'Sẵn sàng',
      FLYING: 'Đang bay',
      MAINTENANCE: 'Bảo trì',
      OUT_OF_SERVICE: 'Ngừng dùng',
    },
  },
  en: {
    title: 'Drone status',
    searchPlaceholder: 'Search serial, model or payload',
    searchAria: 'Search drones',
    filters: {
      ALL: 'All',
      AVAILABLE: 'Available',
      FLYING: 'Flying',
      MAINTENANCE: 'Maintenance',
      OUT_OF_SERVICE: 'Out of service',
    },
  },
})
