import { StateView } from '../../../../../shared/components/odm/StateView'
import type { MissionCalendarItem } from '../../../types/missions'
import type { UseApiQueryState } from '../../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../../shared/i18n'
import { missionsEmptyStateMessages } from './MissionsEmptyState.messages'

export function MissionsEmptyState({
  query,
  missions,
}: {
  query: UseApiQueryState<{ items: MissionCalendarItem[] }>
  missions: MissionCalendarItem[]
}) {
  const { t } = useI18n(missionsEmptyStateMessages)
  return (
    <>
      {!query.loading && !query.error && missions.length === 0 && (
        <section className="odm-or-card">
          <StateView
            state="empty"
            title={t.emptyTitle}
            description={t.emptyDescription}
          />
        </section>
      )}
    </>
  )
}
