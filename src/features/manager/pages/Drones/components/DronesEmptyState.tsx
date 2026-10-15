import { EmptyState } from '../../../../../shared/components/ui'
import type { DroneResponse } from '../../../types/drones'
import type { UseApiQueryState } from '../../../../../shared/hooks/useApiQuery'
import type { PageResponseDroneResponse } from '../../../types/drones'
import { useI18n } from '../../../../../shared/i18n'
import { dronesEmptyStateMessages } from './DronesEmptyState.messages'

export function DronesEmptyState({
  query,
  visible,
}: {
  query: UseApiQueryState<PageResponseDroneResponse>
  visible: DroneResponse[]
}) {
  const { t } = useI18n(dronesEmptyStateMessages)
  return (
    <>
      {!query.loading && !query.error && visible.length === 0 && (
        <EmptyState title={t.emptyTitle} description={t.emptyDescription} />
      )}
    </>
  )
}
