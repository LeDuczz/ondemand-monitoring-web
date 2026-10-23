import { StateView } from '../../../../../shared/components/odm/StateView'
import { ApiError } from '../../../../../shared/api/httpClient'
import { dronesPageMessages } from '../DronesPage.messages'
import { useI18n } from '../../../../../shared/i18n'
import type { UseApiQueryState } from '../../../../../shared/hooks/useApiQuery'
import type { PageResponseDeviceResponse } from '../../../types/drones'

export function DronesLoadError({
  query,
}: {
  query: UseApiQueryState<PageResponseDeviceResponse>
}) {
  const { t } = useI18n(dronesPageMessages)
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
            GET /api/drones · {query.error.status ?? '—'}
          </code>
        )}
      </div>
    </section>
  )
}
