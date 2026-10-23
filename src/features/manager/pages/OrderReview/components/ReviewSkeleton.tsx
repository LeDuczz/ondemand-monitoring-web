import { PageHeader, Skeleton } from '../../../../../shared/components/ui'
import { managerHref } from '../../../routes'
import '../../../components/layout/mgrLayout.css'
import type { PageMessages } from '../reviewTypes'

export function ReviewSkeleton({
  orderId,
  t,
}: {
  orderId: string
  t: PageMessages
}) {
  return (
    <div className="odm-or mgr-page" aria-busy="true" aria-live="polite">
      <PageHeader
        back={<a href={managerHref({ screen: 'orderQueue' })}>{t.breadcrumb}</a>}
        title={t.pageTitle}
        subtitle={orderId}
      />
      <Skeleton variant="block" height={56} />
      <div className="mgr-detail-grid">
        <div className="mgr-detail-main">
          <Skeleton variant="block" height={360} />
          <Skeleton variant="block" height={200} />
        </div>
        <div className="mgr-detail-side">
          <Skeleton variant="block" height={160} />
          <Skeleton variant="block" height={120} />
          <Skeleton variant="block" height={140} />
        </div>
      </div>
      <span className="odm-visually-hidden">{t.loading}</span>
    </div>
  )
}
