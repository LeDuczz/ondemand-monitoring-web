import type { Language } from '../../../../shared/i18n'
import { normalizeKey } from './normalize'

export type TimeslotCode = 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT'

export const TIMESLOT_LABELS: Record<Language, Record<TimeslotCode, string>> = {
  vi: { MORNING: 'Buổi sáng', AFTERNOON: 'Buổi chiều', EVENING: 'Buổi tối', NIGHT: 'Ban đêm' },
  en: { MORNING: 'Morning', AFTERNOON: 'Afternoon', EVENING: 'Evening', NIGHT: 'Night' },
}

/** Minimal shape of a BE `/api/preferred-times` item. */
export type TimeslotRef = {
  id?: string | null
  code?: string | null
  name?: string | null
  startTime?: string | null
  endTime?: string | null
}

const CODES = Object.keys(TIMESLOT_LABELS.en) as TimeslotCode[]
const asCode = (value: string | null | undefined): TimeslotCode | null => {
  const upper = value?.trim().toUpperCase()
  return CODES.find((c) => c === upper) ?? null
}

/** Best-effort code from a Vietnamese name such as "Chiều 13:00–17:00". */
export function timeslotCodeFromName(name: string | null | undefined): TimeslotCode | null {
  if (!name) return null
  const key = normalizeKey(name).replace(/^buoi /, '')
  if (/^(chieu toi|toi)\b/.test(key)) return 'EVENING'
  if (/^chieu\b/.test(key)) return 'AFTERNOON'
  if (/^sang\b/.test(key)) return 'MORNING'
  if (/^(dem|khuya|ban dem)\b/.test(key)) return 'NIGHT'
  return null
}

const hhmm = (value: string | null | undefined) => value?.trim().slice(0, 5) || ''
const RANGE_IN_NAME = /\d{1,2}:\d{2}\s*[–-]\s*\d{1,2}:\d{2}/

/**
 * Resolve an order's slot against the BE list: by id, then by exact name.
 * Returns the reference to use (list item merged over the input).
 */
export function resolveTimeslot(input: TimeslotRef, known: TimeslotRef[] = []): TimeslotRef {
  const byId = input.id ? known.find((t) => t.id === input.id) : undefined
  const nameKey = input.name ? normalizeKey(input.name) : ''
  const byName = byId ?? (nameKey ? known.find((t) => t.name && normalizeKey(t.name) === nameKey) : undefined)
  return byName ? { ...input, ...byName } : input
}

/**
 * Localized "label HH:mm–HH:mm" for a preferred-time slot. English uses the
 * label keyed by code (resolved from id, name, or the name's wording) plus
 * the range; Vietnamese shows the BE name. Falls back to the BE name.
 */
export function localizeTimeslot(
  input: TimeslotRef,
  lang: Language,
  known: TimeslotRef[] = [],
): string {
  const slot = resolveTimeslot(input, known)
  const name = slot.name?.trim() ?? ''
  const code = asCode(slot.code) ?? timeslotCodeFromName(name)
  const start = hhmm(slot.startTime)
  const end = hhmm(slot.endTime)
  const range = start && end ? `${start}–${end}` : (name.match(RANGE_IN_NAME)?.[0] ?? '')

  if (lang === 'en' && code) {
    const label = TIMESLOT_LABELS.en[code]
    return range ? `${label} ${range.replace(/\s+/g, '').replace('-', '–')}` : label
  }
  if (!name) return code ? [TIMESLOT_LABELS[lang][code], range].filter(Boolean).join(' ') : range
  return name && range && !RANGE_IN_NAME.test(name) ? `${name} ${range}` : name
}
