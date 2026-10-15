import type { Language } from '../../../../shared/i18n'
import type {
  TicketSeverity,
  TicketStatus,
} from '../../../../shared/types/domain'

export const COLUMNS: TicketStatus[] = [
  'OPEN',
  'IN_PROGRESS',
  'RESOLVED',
  'CLOSED',
]

export const SEVERITIES: TicketSeverity[] = [
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL',
]

export function formatAge(
  openedAt: string,
  t: {
    daysAgo: (days: number) => string
    hoursAgo: (hours: number) => string
    justNow: string
  },
): string {
  const ms = Date.now() - new Date(openedAt).getTime()
  const days = Math.floor(ms / (1000 * 60 * 60 * 24))
  if (days > 0) return t.daysAgo(days)
  const hours = Math.floor(ms / (1000 * 60 * 60))
  if (hours > 0) return t.hoursAgo(hours)
  return t.justNow
}

// [PROPOSED] Not backend/mock data — hard-coded demo operator, name kept as-is.
export function systemOperatorList(lang: Language) {
  return [
    {
      id: '00000000-0000-0000-0000-000000000004',
      name: 'Seed System Operator',
      email: 'seed.system.operator@odms.local',
      role: lang === 'en' ? 'STAFF (Technician)' : 'STAFF (Kỹ thuật viên)',
      status: lang === 'en' ? 'Available' : 'Sẵn sàng',
    },
  ]
}
