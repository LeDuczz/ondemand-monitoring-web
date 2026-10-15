import { OrderServiceInfo } from '../../../components/common/OrderServiceInfo'
import { OrderCustomerRequestDetails } from '../../../components/common/OrderCustomerRequestDetails'
import { OrderStatusCard } from './OrderStatusCard'
import { OrderCustomerCard } from '../../../components/common/OrderCustomerCard'
import { OrderAttachmentsCard } from '../../../components/common/OrderAttachmentsCard'
import { InternalNoteCard } from './InternalNoteCard'
import { ReviewStageActions } from './ReviewStageActions'
import type { ReviewStep } from '../reviewSteps'
import { useLanguage } from '../../../../../shared/i18n'
import type { OrderDetail } from '../../../types/orders'
import { useI18n } from '../../../../../shared/i18n'
import { reviewInfoStageMessages } from './ReviewInfoStage.messages'

export function ReviewInfoStage({
  order,
  goToStep,
}: {
  order: OrderDetail
  goToStep: (step: ReviewStep) => void
}) {
  const { t } = useI18n(reviewInfoStageMessages)

  const { locale } = useLanguage()
  return (
    <div className="odm-or-review-stage" aria-label={t.orderInformation}>
      <section className="odm-or-grid odm-or-review-summary">
        <div className="odm-or-col">
          <OrderServiceInfo order={order} hideService />
          <OrderCustomerRequestDetails order={order} />
        </div>
        <div className="odm-or-col odm-or-summary-side">
          <OrderStatusCard order={order} locale={locale} />
          <OrderCustomerCard order={order} />
        </div>
      </section>
      <section className="odm-or-grid odm-or-review-more">
        <div className="odm-or-col">
          <OrderAttachmentsCard order={order} />
          <InternalNoteCard orderId={order.id} locale={locale} />
        </div>
      </section>
      <ReviewStageActions step={1} onNext={() => goToStep(2)} />
    </div>
  )
}
