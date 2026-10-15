import { ApiError } from '../../../../../shared/api/httpClient'
import { Card } from '../../../../../shared/components/ui'
import type { MissionCalendarItem } from '../../../types/missions'
import type { UseApiQueryState } from '../../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../../shared/i18n'
import { scheduleLoadErrorMessages } from './ScheduleLoadError.messages'

export function ScheduleLoadError({
  query,
  from,
}: {
  query: UseApiQueryState<{ items: MissionCalendarItem[] }>
  from: string
}) {
  const { t } = useI18n(scheduleLoadErrorMessages)
  return (
    <>
      {!query.loading && !!query.error && (
        <Card>
          <div role="alert" style={{ display: 'grid', gap: 10 }}>
            <div style={{ fontWeight: 600, color: 'var(--ui-danger-text)' }}>
              {t.loadError}
            </div>
            <div className="mng-cell-sub">{t.genericError}</div>
            {query.error instanceof ApiError && (
              <code className="odm-mono mng-cell-sub">
                {query.error.method}
                {t.missionsFrom}
                {from} · {query.error.status ?? '—'}
              </code>
            )}
            <button
              type="button"
              className="odm-btn"
              style={{ justifySelf: 'start' }}
              onClick={query.reload}
            >
              {t.retry}
            </button>
          </div>
        </Card>
      )}
    </>
  )
}
