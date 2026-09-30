import { defineMessages } from '../../../../shared/i18n'

export const rolesPageMessages = defineMessages({
  vi: {
    title: 'Vai trò',
    subtitle: 'Vai trò do hệ thống định nghĩa, chỉ xem.',
    users: 'người dùng',
    loadError: 'Không tải được số liệu',
    retry: 'Thử lại',
    descriptions: {
      ADMIN: 'Toàn quyền quản trị hệ thống, tài khoản và cấu hình.',
      SYSTEM_OPERATOR: 'Giám sát và vận hành hạ tầng, cấu hình hệ thống.',
      DRONE_OPERATOR: 'Thực hiện nhiệm vụ bay và thu thập dữ liệu.',
      STAFF: 'Điều phối đơn hàng, nhiệm vụ và tài nguyên.',
      CUSTOMER: 'Đặt dịch vụ và theo dõi kết quả giám sát.',
    } as Record<string, string>,
  },
  en: {
    title: 'Roles',
    subtitle: 'System-defined roles, read-only.',
    users: 'users',
    loadError: 'Could not load the count',
    retry: 'Retry',
    descriptions: {
      ADMIN: 'Full control over the system, accounts and configuration.',
      SYSTEM_OPERATOR: 'Monitors and operates infrastructure and system settings.',
      DRONE_OPERATOR: 'Flies missions and collects monitoring data.',
      STAFF: 'Coordinates orders, missions and resources.',
      CUSTOMER: 'Orders services and follows monitoring results.',
    } as Record<string, string>,
  },
})
