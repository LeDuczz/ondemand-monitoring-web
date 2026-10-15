import { EmptyState } from '../../../../../shared/components/ui'
import { managerHref } from '../../../routes'
import { useI18n } from '../../../../../shared/i18n'
import { queueEmptyStateMessages } from './QueueEmptyState.messages'

export function QueueEmptyState() {
  const { t } = useI18n(queueEmptyStateMessages)
  return (
    <EmptyState
      title={t.emptyTitle}
      description={t.emptyDescription}
      action={
        <a
          className="odm-btn odm-btn-p"
          href={managerHref({ screen: 'missions' })}
          style={{ textDecoration: 'none' }}
        >
          {t.viewMissions}
        </a>
      }
    />
  )
}
