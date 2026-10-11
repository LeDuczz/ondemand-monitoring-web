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
      STAFF:
        'Thực hiện nhiệm vụ theo phân công: bay, dữ liệu, kiểm tra, bảo trì hoặc hỗ trợ.',
      MANAGER: 'Điều phối đơn hàng, nhiệm vụ và tài nguyên.',
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
      STAFF:
        'Performs assigned flight, payload, inspection, maintenance or support duties.',
      MANAGER: 'Coordinates orders, missions and resources.',
      CUSTOMER: 'Orders services and follows monitoring results.',
    } as Record<string, string>,
  },
})
