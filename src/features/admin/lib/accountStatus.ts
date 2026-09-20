import type { StatusTone } from '../../../shared/types/domain'
import type { AccountStatus } from '../types/accounts'
import type { UserRole } from '../../auth/types'

type Meta = { label: string; tone: StatusTone }

export const ACCOUNT_STATUS_META: Record<AccountStatus, Meta> = {
  ACTIVE: { label: 'Hoạt động', tone: 'green' },
  INACTIVE: { label: 'Đã khoá', tone: 'gray' },
  PENDING: { label: 'Chưa xác thực', tone: 'yellow' },
}

export const ROLE_LABEL: Record<UserRole, string> = {
  ADMIN: 'Quản trị viên',
  STAFF: 'Nhân viên điều hành',
  DRONE_OPERATOR: 'Phi công drone',
  SYSTEM_OPERATOR: 'Vận hành hệ thống',
  CUSTOMER: 'Khách hàng',
  AUDITOR: 'Kiểm toán',
}

export function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function daysDiff(isoDate: string): number {
  const now = new Date()
  const target = new Date(isoDate)
  const diff = target.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}
