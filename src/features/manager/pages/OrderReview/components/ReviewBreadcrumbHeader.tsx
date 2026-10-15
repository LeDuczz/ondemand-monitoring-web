import { managerHref } from '../../../routes'
import { useI18n } from '../../../../../shared/i18n'
import { reviewBreadcrumbHeaderMessages } from './ReviewBreadcrumbHeader.messages'

export function ReviewBreadcrumbHeader({ orderId }: { orderId: string }) {
  const { t } = useI18n(reviewBreadcrumbHeaderMessages)

  return (
    <div className="odm-mgr-review-breadcrumb">
      <a href={managerHref({ screen: 'orderQueue' })}>{t.breadcrumb}</a>
      <span aria-hidden="true">/</span>
      <span>{orderId}</span>
    </div>
  )
}
