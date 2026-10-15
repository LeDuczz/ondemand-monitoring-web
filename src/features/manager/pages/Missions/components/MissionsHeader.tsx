import type { MissionCalendarItem } from '../../../types/missions'
import type { UseApiQueryState } from '../../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../../shared/i18n'
import { missionsHeaderMessages } from './MissionsHeader.messages'

export function MissionsHeader({
  title,
  query,
  missions,
}: {
  title: string
  query: UseApiQueryState<{ items: MissionCalendarItem[] }>
  missions: MissionCalendarItem[]
}) {
  const { t } = useI18n(missionsHeaderMessages)
  return (
    <div className="odm-or-pagehead">
      <h1 className="odm-or-title">{title}</h1>
      <p className="odm-or-subtitle">
        {!query.loading && !query.error ? t.missionCount(missions.length) : ' '}
      </p>
    </div>
  )
}
