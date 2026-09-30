import { fmtDate } from '../orderStatus'

type Locale = 'vi-VN' | 'en-US'

/** `dd/mm/yyyy` or `dd/mm/yyyy → dd/mm/yyyy`; null when there is no date. */
export function formatDateRange(
  from: string | null,
  to: string | null,
  locale: Locale,
): string | null {
  if (!from && !to) return null
  if (!from || !to || from === to) return fmtDate((from ?? to) as string, locale)
  return `${fmtDate(from, locale)} → ${fmtDate(to, locale)}`
}
