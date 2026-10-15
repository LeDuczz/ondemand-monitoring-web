import { StateView } from '../../../../../shared/components/odm/StateView'
import { managerHref } from '../../../routes'
import { useI18n } from '../../../../../shared/i18n'
import { queueEmptyStateMessages } from './QueueEmptyState.messages'

export function QueueEmptyState() {
  const { t } = useI18n(queueEmptyStateMessages)
  return (
    <StateView
      state="empty"
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
