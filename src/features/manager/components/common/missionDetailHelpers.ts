import type {
  MediaResponse,
  MissionResponse,
  MissionResultResponse,
  MissionStaffAssignmentResponse,
  PersistedPostDeviceCheckResponse,
  PersistedPreflightCheckResponse,
  WeatherPreflightCheckResponse,
} from '../../types/missions'
import type { OrderDetail } from '../../types/orders'
import { missionDetailHelpersMessages } from './missionDetailHelpers.messages'

export function formatDateTime(
  value: string | null | undefined,
  locale: 'vi-VN' | 'en-US',
) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const day = date.toLocaleDateString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  const time = date.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  })
  return locale === 'vi-VN' ? `${day} ${time}` : `${day}, ${time}`
}

export type HelperLang = 'vi' | 'en'

const localeOf = (lang: HelperLang) => (lang === 'en' ? 'en-US' : 'vi-VN')

export function formatNumber(
  value: number | null | undefined,
  suffix = '',
  lang: HelperLang = 'vi',
) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return `${new Intl.NumberFormat(localeOf(lang), { maximumFractionDigits: 1 }).format(value)}${suffix}`
}

export function formatDuration(
  seconds: number | null | undefined,
  lang: HelperLang = 'vi',
) {
  if (seconds === null || seconds === undefined) return '—'
  const t = missionDetailHelpersMessages[lang]
  if (seconds < 60) return t.durationSeconds(Math.round(seconds))
  const minutes = Math.floor(seconds / 60)
  const rest = Math.round(seconds % 60)
  return rest > 0 ? t.durationMinSec(minutes, rest) : t.durationMinutes(minutes)
}

/** Badge tone for a check/result status (matches the shared `UiTone`). */
export function checkTone(
  status: string | null | undefined,
): 'success' | 'danger' | 'info' | 'warning' {
  if (status === 'PASSED' || status === 'APPROVED' || status === 'COMPLETED')
    return 'success'
  if (status === 'FAILED' || status === 'REJECTED') return 'danger'
  if (status === 'CHECKING' || status === 'IN_PROGRESS') return 'info'
  return 'warning'
}

export function checkLabel(
  status: string | null | undefined,
  lang: HelperLang = 'vi',
) {
  const labels: Record<string, string> =
    missionDetailHelpersMessages[lang].checkLabels
  return status ? (labels[status] ?? status) : '—'
}

export function staffRoleLabel(
  role: MissionStaffAssignmentResponse['assignedRole'],
  lang: HelperLang = 'vi',
) {
  return missionDetailHelpersMessages[lang].staffRoles[role]
}

export function staffResponseLabel(
  status: MissionStaffAssignmentResponse['responseStatus'],
  lang: HelperLang = 'vi',
) {
  return missionDetailHelpersMessages[lang].staffResponses[status]
}

export function assignmentTone(
  status: MissionStaffAssignmentResponse['responseStatus'],
) {
  if (status === 'ACCEPTED') return 'green'
  if (status === 'REJECTED') return 'red'
  return 'amber'
}

export function assignmentUiTone(
  status: MissionStaffAssignmentResponse['responseStatus'],
): 'success' | 'danger' | 'warning' {
  if (status === 'ACCEPTED') return 'success'
  if (status === 'REJECTED') return 'danger'
  return 'warning'
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase()
}

export type DetailData = {
  mission: MissionResponse | null
  order: OrderDetail | null
  preflight: PersistedPreflightCheckResponse | null
  postcheck: PersistedPostDeviceCheckResponse | null
  result: MissionResultResponse | null
  media: MediaResponse[]
  weather: WeatherPreflightCheckResponse | null
}

export function unwrapSettled<T>(value: PromiseSettledResult<T>): T | null {
  return value.status === 'fulfilled' ? value.value : null
}
