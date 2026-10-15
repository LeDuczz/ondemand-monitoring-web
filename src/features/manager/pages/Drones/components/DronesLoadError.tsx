import { StateView } from '../../../../../shared/components/odm/StateView'
import { Card } from '../../../../../shared/components/ui'
import { ApiError } from '../../../../../shared/api/httpClient'
import type { UseApiQueryState } from '../../../../../shared/hooks/useApiQuery'
import type { PageResponseDroneResponse } from '../../../types/drones'
import { useI18n } from '../../../../../shared/i18n'
import { dronesLoadErrorMessages } from './DronesLoadError.messages'

export function DronesLoadError({
  query,
}: {
  query: UseApiQueryState<PageResponseDroneResponse>
}) {
  const { t } = useI18n(dronesLoadErrorMessages)
  return (
    <>
      {!query.loading && !!query.error && (
        <Card>
          <StateView
            state="error"
            title={t.loadError}
            error={query.error}
            onRetry={query.reload}
          />
          {query.error instanceof ApiError && (
            <code
              className="odm-mono mng-cell-sub"
              style={{ display: 'block' }}
            >
              {t.getApiDrones}
              {query.error.status ?? '—'}
            </code>
          )}
        </Card>
      )}
    </>
  )
}
