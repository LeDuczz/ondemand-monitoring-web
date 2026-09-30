import type { StatusTone } from '../../../shared/types/domain'
import type { AccountStatus } from '../types/accounts'
import type { Language } from '../../../shared/i18n'

type Meta = { label: string; tone: StatusTone }

export const ACCOUNT_STATUS_META: Record<AccountStatus, Meta> = {
  ACTIVE: { label: 'Hoạt động', tone: 'green' },
  INACTIVE: { label: 'Đã khoá', tone: 'gray' },
  PENDING: { label: 'Chưa xác thực', tone: 'yellow' },
}

const ACCOUNT_STATUS_META_EN: Record<AccountStatus, Meta> = {
  ACTIVE: { label: 'Active', tone: 'green' },
  INACTIVE: { label: 'Locked', tone: 'gray' },
  PENDING: { label: 'Unverified', tone: 'yellow' },
}

export function getAccountStatusMeta(
  status: AccountStatus,
  lang: Language = 'vi',
): Meta {
  return lang === 'en'
    ? ACCOUNT_STATUS_META_EN[status]
    : ACCOUNT_STATUS_META[status]
}

export function fmtDateTime(iso: string, lang: Language = 'vi'): string {
  return new Date(iso).toLocaleString(lang === 'en' ? 'en-US' : 'vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function fmtDate(iso: string, lang: Language = 'vi'): string {
  return new Date(iso).toLocaleDateString(lang === 'en' ? 'en-US' : 'vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}
