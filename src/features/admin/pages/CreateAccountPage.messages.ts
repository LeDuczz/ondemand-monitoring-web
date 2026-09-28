import { defineMessages } from '../../../shared/i18n'

export const createAccountPageMessages = defineMessages({
  vi: {
    roleDescriptions: {
      STAFF: 'Duyệt đơn, điều phối mission, giao kết quả.',
      DRONE_OPERATOR: 'Thực hiện bay, ghi nhận dữ liệu mission.',
      SYSTEM_OPERATOR: 'Giám sát thiết bị, telemetry, cảnh báo hệ thống.',
    },
    required: 'Bắt buộc',
    invalidEmail: 'Email không hợp lệ',
    genericError: 'Có lỗi xảy ra.',
    createdTitle: 'Tài khoản đã được tạo!',
    createdDescriptionPrefix: 'Lời mời đã gửi đến',
    createdDescriptionSuffix:
      '. Nhân viên cần đổi mật khẩu khi đăng nhập lần đầu.',
    viewList: 'Xem danh sách',
    createAnother: 'Tạo tài khoản khác',
    backToAccounts: '← Tài khoản',
    pageTitle: 'Tạo tài khoản nhân viên',
    pageSubtitle:
      'Hệ thống sẽ gửi lời mời qua email. Admin không cần nhập mật khẩu.',
    personalInfo: 'Thông tin cá nhân',
    fullName: 'Họ và tên',
    fullNamePlaceholder: 'VD: Nguyễn Văn A',
    workEmail: 'Email công việc',
    role: 'Vai trò',
    roleHint:
      'Vai trò quyết định không gian làm việc và quyền hạn sau khi đăng nhập.',
    sending: 'Đang gửi...',
    sendInvite: 'Gửi lời mời →',
    cancel: 'Huỷ',
  },
  en: {
    roleDescriptions: {
      STAFF: 'Review requests, coordinate missions, deliver results.',
      DRONE_OPERATOR: 'Fly missions and record mission data.',
      SYSTEM_OPERATOR: 'Monitor devices, telemetry, and system alerts.',
    },
    required: 'Required',
    invalidEmail: 'Invalid email',
    genericError: 'Something went wrong.',
    createdTitle: 'Account created!',
    createdDescriptionPrefix: 'An invitation has been sent to',
    createdDescriptionSuffix:
      '. The employee must change their password on first login.',
    viewList: 'View list',
    createAnother: 'Create another account',
    backToAccounts: '← Accounts',
    pageTitle: 'Create employee account',
    pageSubtitle:
      'The system will send an invitation by email. No password is entered by the admin.',
    personalInfo: 'Personal information',
    fullName: 'Full name',
    fullNamePlaceholder: 'E.g.: John Smith',
    workEmail: 'Work email',
    role: 'Role',
    roleHint:
      'The role determines the workspace and permissions after sign-in.',
    sending: 'Sending...',
    sendInvite: 'Send invitation →',
    cancel: 'Cancel',
  },
})
