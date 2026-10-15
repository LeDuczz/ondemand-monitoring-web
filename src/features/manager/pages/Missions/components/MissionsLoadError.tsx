import { StateView } from '../../../../../shared/components/odm/StateView'
import type { MissionCalendarItem } from '../../../types/missions'
import type { UseApiQueryState } from '../../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../../shared/i18n'
import { missionsLoadErrorMessages } from './MissionsLoadError.messages'

export function MissionsLoadError({
  query,
}: {
  query: UseApiQueryState<{ items: MissionCalendarItem[] }>
}) {
  const { t } = useI18n(missionsLoadErrorMessages)
  return (
    <>
      {!query.loading && !!query.error && (
        <section className="odm-or-card">
          <div className="odm-or-card-body">
            <StateView
              state="error"
              title={t.loadError}
              error={t.couldNotLoadTheMission}
              onRetry={query.reload}
            />
          </div>
        </section>
      )}
    </>
  )
}
