import type { StatusTone } from '../../../shared/types/domain'
import type { AccountStatus } from '../types/accounts'
import type { UserRole } from '../../auth/types'

type Meta = { label: string; tone: StatusTone }

export const ACCOUNT_STATUS_META: Record<AccountStatus, Meta> = {
  ACTIVE: { label: 'Hoạt động', tone: 'green' },
  INACTIVE: { label: 'Vô hiệu', tone: 'gray' },
  PENDING: { label: 'Chờ xác minh', tone: 'yellow' },
}

export const ROLE_LABEL: Record<UserRole, string> = {
  ADMIN: 'Quản trị',
  STAFF: 'Nhân viên điều hành',
  DRONE_OPERATOR: 'Phi công drone',
  SYSTEM_OPERATOR: 'Vận hành hệ thống',
  CUSTOMER: 'Khách hàng',
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
