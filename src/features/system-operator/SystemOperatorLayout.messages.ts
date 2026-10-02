import { defineMessages } from '../../shared/i18n'

export const systemOperatorLayoutMessages = defineMessages({
  vi: {
    ariaNav: 'Điều hướng vận hành hệ thống',
    group: 'Vận hành hệ thống',
    roleLabel: 'Vận hành hệ thống',
    nav: {
      overview: 'Tổng quan hệ thống',
      maintenance: 'Bảo trì & Sự cố',
      devices: 'Thiết bị',
      telemetry: 'Dữ liệu telemetry',
      alerts: 'Cảnh báo',
    },
    openMenu: 'Mở menu',
    closeMenu: 'Đóng menu',
    toggleTheme: 'Đổi giao diện sáng/tối',
    userFallback: 'Vận hành hệ thống',
  },
  en: {
    ariaNav: 'System operations navigation',
    group: 'System operations',
    roleLabel: 'System operations',
    nav: {
      overview: 'System overview',
      maintenance: 'Maintenance & incidents',
      devices: 'Devices',
      telemetry: 'Telemetry data',
      alerts: 'Alerts',
    },
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    toggleTheme: 'Toggle light/dark theme',
    userFallback: 'System operator',
  },
})
