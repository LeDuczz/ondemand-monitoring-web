import { EmptyState } from '../../../../../shared/components/ui'
import { managerHref } from '../../../routes'
import { useI18n } from '../../../../../shared/i18n'
import { liveEmptyStateMessages } from './LiveEmptyState.messages'

export function LiveEmptyState() {
  const { t } = useI18n(liveEmptyStateMessages)
  return (
    <EmptyState
      title={t.emptyState.selectMission}
      description={t.emptyState.noFlying}
      action={
        <a href={managerHref({ screen: 'schedule' })}>
          {t.emptyState.viewSchedule}
        </a>
      }
    />
  )
}
