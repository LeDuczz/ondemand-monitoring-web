import { EmptyState } from '../../../shared/components/odm/StateView'
import { useI18n } from '../../../shared/i18n'
import { notificationsPageMessages } from './NotificationsPage.messages'

export function NotificationsPage() {
  const { t } = useI18n(notificationsPageMessages)
  return (
    <div>
      <h1 style={{ margin: '0 0 20px', fontSize: 20, fontWeight: 700 }}>
        {t.title}
      </h1>
      <EmptyState title={t.emptyTitle} description={t.emptyDescription} />
    </div>
  )
}
