import { PageHeader, Skeleton } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import '../../../components/layout/mgrLayout.css'
import { orderQueuePageMessages } from '../OrderQueuePage.messages'

export function QueueSkeleton() {
  const { t } = useI18n(orderQueuePageMessages)
  return (
    <div className="mgr-page" aria-busy="true" aria-live="polite">
      <PageHeader title={t.title} />
      <div className="mgr-kpis">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} variant="block" height={92} />
        ))}
      </div>
      <Skeleton variant="block" height={320} />
      <span className="odm-visually-hidden">{t.loading}</span>
    </div>
  )
}
