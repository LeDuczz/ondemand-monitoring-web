import { defineMessages } from '../../../shared/i18n'

export const accountsPageMessages = defineMessages({
  vi: {
    title: 'Người dùng',
    createInternal: '+ Tạo người dùng nội bộ',
    emptyTitle: 'Không tìm thấy tài khoản',
    emptyDescription: 'Thử thay đổi bộ lọc hoặc tạo tài khoản mới.',
    createAccount: 'Tạo tài khoản',
    columnUser: 'Người dùng',
    columnRole: 'Vai trò',
    columnStatus: 'Trạng thái',
    columnCertExpiry: 'Chứng chỉ hết hạn',
    columnLastLogin: 'Đăng nhập cuối',
    columnActions: 'Thao tác',
    unverifiedEmail: 'Chưa xác thực email',
  },
  en: {
    title: 'Users',
    createInternal: '+ Create internal user',
    emptyTitle: 'No accounts found',
    emptyDescription: 'Try changing the filters or create a new account.',
    createAccount: 'Create account',
    columnUser: 'User',
    columnRole: 'Role',
    columnStatus: 'Status',
    columnCertExpiry: 'Certificate expiry',
    columnLastLogin: 'Last login',
    columnActions: 'Actions',
    unverifiedEmail: 'Email not verified',
  },
})
