import { EmptyState } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import { maintenanceEmptyStateMessages } from './MaintenanceEmptyState.messages'

export function MaintenanceEmptyState() {
  const { t } = useI18n(maintenanceEmptyStateMessages)
  return <EmptyState title={t.emptyTitle} description={t.emptyDescription} />
}
