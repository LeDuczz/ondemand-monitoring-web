import type { StatusTone } from '../../../shared/types/domain'
import type { AccountStatus, AdminAccountItem } from '../types/accounts'
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

export type AccountCounts = {
  total: number
  pilots: number
  locked: number
}

export function computeAccountCounts(items: AdminAccountItem[]): AccountCounts {
  let pilots = 0
  let locked = 0
  for (const acc of items) {
    if (acc.role === 'DRONE_OPERATOR') pilots += 1
    if (acc.status === 'INACTIVE') locked += 1
  }
  return { total: items.length, pilots, locked }
}

export function accountsSubtitle(counts: AccountCounts): string {
  return `${counts.total} tài khoản · ${counts.pilots} phi công · ${counts.locked} tài khoản bị khoá`
}

export function pageRangeLabel(currentCount: number, total: number): string {
  if (total === 0) return 'Hiển thị 0/0'
  return `Hiển thị 1–${currentCount}/${total}`
}

export function daysDiff(isoDate: string): number {
  const now = new Date()
  const target = new Date(isoDate)
  const diff = target.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

const CERT_WARNING_DAYS = 30

export function certDaysLeftLabel(isoDate: string): string | null {
  const days = daysDiff(isoDate)
  if (days < 0 || days > CERT_WARNING_DAYS) return null
  return `Còn ${days} ngày`
}

export type AccountFilters = {
  query?: string
  role?: UserRole | ''
  status?: AccountStatus | ''
}

export function filterAccounts(
  items: AdminAccountItem[],
  filters: AccountFilters,
): AdminAccountItem[] {
  const query = (filters.query ?? '').trim().toLowerCase()
  return items.filter((acc) => {
    if (filters.role && acc.role !== filters.role) return false
    if (filters.status && acc.status !== filters.status) return false
    if (
      query &&
      !acc.fullName.toLowerCase().includes(query) &&
      !acc.email.toLowerCase().includes(query)
    ) {
      return false
    }
    return true
  })
}
