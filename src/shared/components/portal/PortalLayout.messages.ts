import { defineMessages } from '../../i18n'

// Only strings live here (icons + hrefs stay in PortalLayout.tsx as plain
// data) so DeepWiden never has to touch a union-typed field like IconName.
export const portalLayoutMessages = defineMessages({
  vi: {
    roleLabels: {
      CUSTOMER: 'Không gian khách hàng',
      STAFF: 'Không gian vận hành',
      DRONE_OPERATOR: 'Vận hành drone',
      SYSTEM_OPERATOR: 'Vận hành hệ thống',
      ADMIN: 'Quản trị',
      AUDITOR: 'Không gian kiểm toán',
    },
    // one label per entry in PortalLayout's `navItems[role]`, same order.
    navLabels: {
      CUSTOMER: ['Tổng quan', 'Tạo yêu cầu', 'Yêu cầu của tôi', 'Báo cáo'],
      STAFF: [
        'Tổng quan vận hành',
        'Hàng đợi yêu cầu',
        'Phân công',
        'Lịch làm việc',
      ],
      DRONE_OPERATOR: [
        'Bảng điều khiển mission',
        'Kiểm tra trước bay',
        'Dữ liệu telemetry',
      ],
      SYSTEM_OPERATOR: [
        'Tổng quan hệ thống',
        'Bảo trì & Sự cố',
        'Thiết bị',
        'Dữ liệu telemetry',
        'Cảnh báo',
      ],
      ADMIN: [
        'Tổng quan quản trị',
        'Người dùng',
        'Mission',
        'Nhật ký kiểm tra',
      ],
      AUDITOR: ['Nhật ký kiểm tra'],
    },
    nav: 'Điều hướng cổng thông tin',
    lightMode: 'Chế độ sáng',
    darkMode: 'Chế độ tối',
    closeNav: 'Đóng điều hướng',
    openNav: 'Mở điều hướng',
    fieldwiseUser: 'Người dùng Fieldwise',
  },
  en: {
    roleLabels: {
      CUSTOMER: 'Customer workspace',
      STAFF: 'Operations workspace',
      DRONE_OPERATOR: 'Drone operations',
      SYSTEM_OPERATOR: 'System operations',
      ADMIN: 'Administration',
      AUDITOR: 'Audit workspace',
    },
    navLabels: {
      CUSTOMER: ['Overview', 'Create request', 'My requests', 'Reports'],
      STAFF: [
        'Operations overview',
        'Request queue',
        'Assignments',
        'Schedule',
      ],
      DRONE_OPERATOR: ['Mission console', 'Preflight checks', 'Telemetry'],
      SYSTEM_OPERATOR: [
        'System overview',
        'Maintenance & Incidents',
        'Devices',
        'Telemetry',
        'Alerts',
      ],
      ADMIN: ['Admin overview', 'Users', 'Missions', 'Audit logs'],
      AUDITOR: ['Audit log'],
    },
    nav: 'Portal navigation',
    lightMode: 'Light mode',
    darkMode: 'Dark mode',
    closeNav: 'Close navigation',
    openNav: 'Open navigation',
    fieldwiseUser: 'Fieldwise user',
  },
})
