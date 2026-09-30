import { defineMessages } from '../../../../shared/i18n'

export const adminDashboardPageMessages = defineMessages({
  vi: {
    title: 'Tổng quan hệ thống',
    createAccount: '+ Tạo tài khoản',
    totalAccounts: 'Tổng tài khoản',
    systemWide: 'toàn hệ thống',
    active: 'Đang hoạt động',
    locked: 'Đã khoá',
    accountsUnit: 'tài khoản',
    byRole: 'Phân bổ theo vai trò',
    latestAccounts: 'Tài khoản mới nhất',
    viewAll: 'Xem tất cả →',
    statsError: 'Không tải được thống kê tài khoản',
    retry: 'Thử lại',
  },
  en: {
    title: 'System overview',
    createAccount: '+ Create account',
    totalAccounts: 'Total accounts',
    systemWide: 'system-wide',
    active: 'Active',
    locked: 'Locked',
    accountsUnit: 'accounts',
    byRole: 'Breakdown by role',
    latestAccounts: 'Latest accounts',
    viewAll: 'View all →',
    statsError: 'Could not load account statistics',
    retry: 'Retry',
  },
})
