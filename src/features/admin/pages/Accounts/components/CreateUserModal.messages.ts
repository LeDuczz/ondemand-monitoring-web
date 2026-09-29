import { defineMessages } from '../../../../../shared/i18n'

export const createUserModalMessages = defineMessages({
  vi: {
    title: 'Tạo tài khoản',
    subtitle: 'Hệ thống gửi lời mời qua email. Admin không cần nhập mật khẩu.',
    fullName: 'Họ và tên',
    fullNamePlaceholder: 'VD: Nguyễn Văn A',
    email: 'Email',
    role: 'Vai trò',
    roleDescriptions: {
      ADMIN: 'Quản trị người dùng, danh mục và cấu hình hệ thống.',
      STAFF: 'Duyệt đơn, điều phối mission, giao kết quả.',
      DRONE_OPERATOR: 'Thực hiện bay, ghi nhận dữ liệu mission.',
      SYSTEM_OPERATOR: 'Giám sát thiết bị, telemetry, cảnh báo hệ thống.',
    } as Record<string, string>,
    required: 'Bắt buộc',
    invalidEmail: 'Email không hợp lệ',
    genericError: 'Có lỗi xảy ra.',
    sending: 'Đang gửi...',
    submit: 'Tạo & gửi lời mời',
    cancel: 'Huỷ',
  },
  en: {
    title: 'Create account',
    subtitle:
      'The system sends an invitation by email. No password is entered by the admin.',
    fullName: 'Full name',
    fullNamePlaceholder: 'E.g.: John Smith',
    email: 'Email',
    role: 'Role',
    roleDescriptions: {
      ADMIN: 'Manage users, catalog and system configuration.',
      STAFF: 'Review requests, coordinate missions, deliver results.',
      DRONE_OPERATOR: 'Fly missions and record mission data.',
      SYSTEM_OPERATOR: 'Monitor devices, telemetry, and system alerts.',
    } as Record<string, string>,
    required: 'Required',
    invalidEmail: 'Invalid email',
    genericError: 'Something went wrong.',
    sending: 'Sending...',
    submit: 'Create & send invitation',
    cancel: 'Cancel',
  },
})
