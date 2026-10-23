import { StateView } from '../../../../../shared/components/odm/StateView'
import { ApiError } from '../../../../../shared/api/httpClient'
import { maintenancePageMessages } from '../MaintenancePage.messages'
import { useI18n } from '../../../../../shared/i18n'
import type { UseApiQueryState } from '../../../../../shared/hooks/useApiQuery'
import type { MaintenanceTicket } from '../../../types/maintenance'

export function MaintenanceLoadError({
  query,
}: {
  query: UseApiQueryState<{ items: MaintenanceTicket[]; total: number }>
}) {
  const { t } = useI18n(maintenancePageMessages)
  return (
    <section className="odm-or-card">
      <div className="odm-or-card-body">
        <StateView
          state="error"
          title={t.loadError}
          error={query.error}
          onRetry={query.reload}
        />
        {query.error instanceof ApiError && (
          <code className="odm-mono odm-or-load-error-code">
            GET /api/maintenance-tickets · {query.error.status ?? '—'}
          </code>
        )}
      </div>
    </section>
  )
}
