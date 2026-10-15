import { ApiError } from '../../../../../shared/api/httpClient'
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
        <div style={{ padding: 24 }}>
          <div
            className="odm-card"
            style={{
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
            role="alert"
          >
            <div style={{ fontWeight: 600, color: 'var(--red-fg)' }}>
              {t.loadError}
            </div>
            <div style={{ fontSize: 13, color: 'var(--tx2)' }}>
              {t.genericError}
            </div>
            {query.error instanceof ApiError && (
              <code
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: 'var(--tx3)',
                }}
              >
                {query.error.method}
                {t.missionsFrom}
                {from} · {query.error.status ?? '—'}
              </code>
            )}
            <button
              type="button"
              className="odm-btn"
              style={{ alignSelf: 'flex-start' }}
              onClick={query.reload}
            >
              {t.retry}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
