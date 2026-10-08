import { useLanguage } from '../../../../../shared/i18n'

/** `2026-11-12` -> "Thứ Năm" / "Thursday"; empty for anything that is not a real calendar date. */
export function weekdayOf(value: string, lang: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return ''
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])]
  const date = new Date(Date.UTC(year, month - 1, day))
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return ''
  const text = new Intl.DateTimeFormat(lang === 'vi' ? 'vi-VN' : 'en-US', { weekday: 'long', timeZone: 'UTC' }).format(date)
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/**
 * Line under a native date input. The input already shows the date in the browser's own format, so repeating it
 * added nothing; the weekday is the part the control does not show.
 */
export function DateEcho({ value }: { value: string }) {
  const { lang } = useLanguage()
  const weekday = weekdayOf(value, lang)
  return weekday ? <div className="co-date-shown">{weekday}</div> : null
}
