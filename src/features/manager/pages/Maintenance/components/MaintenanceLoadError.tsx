import { StateView } from '../../../../../shared/components/odm/StateView'
import { ApiError } from '../../../../../shared/api/httpClient'
import type { MaintenanceTicket } from '../../../types/maintenance'
import type { UseApiQueryState } from '../../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../../shared/i18n'
import { maintenanceLoadErrorMessages } from './MaintenanceLoadError.messages'

export function MaintenanceLoadError({
  query,
}: {
  query: UseApiQueryState<{ items: MaintenanceTicket[]; total: number }>
}) {
  const { t } = useI18n(maintenanceLoadErrorMessages)
  return (
    <>
      {!query.loading && !!query.error && (
        <div style={{ padding: 24 }}>
          <StateView
            state="error"
            title={t.page.loadError}
            error={query.error}
            onRetry={query.reload}
          />
          {query.error instanceof ApiError && (
            <code
              className="odm-mono"
              style={{
                display: 'block',
                fontSize: 11,
                color: 'var(--tx3)',
                marginTop: 8,
              }}
            >
              {t.getApiMaintenanceTickets}
              {query.error.status ?? '—'}
            </code>
          )}
        </div>
      )}
    </>
  )
}
