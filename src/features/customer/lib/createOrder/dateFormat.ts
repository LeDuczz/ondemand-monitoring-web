/** `2026-10-07` -> `07/10/2026` for Vietnamese, `10/07/2026` for English; empty when invalid. */
export function formatIsoDate(value: string, lang: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return ''
  return lang === 'vi' ? `${match[3]}/${match[2]}/${match[1]}` : `${match[2]}/${match[3]}/${match[1]}`
}
