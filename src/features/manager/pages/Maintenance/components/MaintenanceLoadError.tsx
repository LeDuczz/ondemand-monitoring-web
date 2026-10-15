import { StateView } from '../../../../../shared/components/odm/StateView'
import { Card } from '../../../../../shared/components/ui'
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
        <Card>
          <StateView
            state="error"
            title={t.page.loadError}
            error={query.error}
            onRetry={query.reload}
          />
          {query.error instanceof ApiError && (
            <code
              className="odm-mono mng-cell-sub"
              style={{ display: 'block' }}
            >
              {t.getApiMaintenanceTickets}
              {query.error.status ?? '—'}
            </code>
          )}
        </Card>
      )}
    </>
  )
}
