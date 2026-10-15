import { EmptyState } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import { missionsEmptyStateMessages } from './MissionsEmptyState.messages'

export function MissionsEmptyState() {
  const { t } = useI18n(missionsEmptyStateMessages)
  return <EmptyState title={t.emptyTitle} description={t.emptyDescription} />
}
