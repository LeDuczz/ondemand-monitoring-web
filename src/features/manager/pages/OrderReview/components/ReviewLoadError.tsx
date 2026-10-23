import { Button, EmptyState, PageHeader } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import '../../../components/layout/mgrLayout.css'
import { managerHref } from '../../../routes'
import { orderReviewPageMessages } from '../OrderReviewPage.messages'

export function ReviewLoadError({
  orderId,
  is409,
}: {
  orderId: string
  is409: boolean
}) {
  const { t } = useI18n(orderReviewPageMessages)
  return (
    <div className="mgr-page">
      <PageHeader
        back={<a href={managerHref({ screen: 'orderQueue' })}>{t.breadcrumb}</a>}
        title={t.pageTitle}
        subtitle={orderId}
      />
      <div className="ui-table-card">
        <EmptyState
          title={t.loadError}
          description={is409 ? t.error409 : t.errorGeneric}
          action={
            <Button variant="primary" href={managerHref({ screen: 'orderQueue' })}>
              {t.backToQueue}
            </Button>
          }
        />
      </div>
    </div>
  )
}
