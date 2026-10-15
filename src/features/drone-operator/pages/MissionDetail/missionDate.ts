import { useI18n } from '../../../../shared/i18n'
import { missionDateMessages } from './missionDate.messages'

type MissionDateLabels = typeof missionDateMessages.vi

export function formatMissionDate(
  isoDate: string,
  labels: MissionDateLabels,
  locale: string,
): string {
  if (!isoDate) return labels.notScheduled
  const d = new Date(`${isoDate}T00:00:00+07:00`)
  return `${labels.weekdays[d.getDay()]}, ${d.toLocaleDateString(locale)}`
}

/** Locale-aware `formatMissionDate` bound to the current UI language. */
export function useMissionDateFormatter(): (isoDate: string) => string {
  const { t, locale } = useI18n(missionDateMessages)
  return (isoDate) => formatMissionDate(isoDate, t, locale)
}
