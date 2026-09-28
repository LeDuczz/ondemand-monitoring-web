import { defineMessages } from '../../../shared/i18n'

export const systemOperatorHomePageMessages = defineMessages({
  vi: {
    maintenanceTitle: 'Quản lý Bảo trì & Sự cố Fleet',
    maintenanceSubtitle:
      'Theo dõi Ticket sự cố được phân công, cập nhật báo cáo kỹ thuật và khôi phục Drone về trạng thái AVAILABLE.',
    devicesTitle: 'Quản lý Trạng thái Thiết bị',
    devicesSubtitle:
      'Theo dõi dung lượng pin, kết quả kiểm tra kỹ thuật và trạng thái khả dụng của các Drone trong hệ thống.',
  },
  en: {
    maintenanceTitle: 'Fleet Maintenance & Incident Management',
    maintenanceSubtitle:
      'Track assigned incident tickets, update technical reports, and restore drones to AVAILABLE status.',
    devicesTitle: 'Device Status Management',
    devicesSubtitle:
      'Track battery level, technical check results, and availability status of the drones in the system.',
  },
})
