import { OrderServiceInfo } from '../../../components/common/OrderServiceInfo'
import { OrderCustomerRequestDetails } from '../../../components/common/OrderCustomerRequestDetails'
import { ReadOnlyScope } from './ReadOnlyScope'
import { ReviewStageActions } from './ReviewStageActions'
import type { ReviewStep } from '../reviewSteps'
import type { OrderDetail } from '../../../types/orders'
import { useI18n } from '../../../../../shared/i18n'
import { reviewInfoStageMessages } from './ReviewInfoStage.messages'

export function ReviewInfoStage({
  order,
  goToStep,
  readOnly = false,
}: {
  order: OrderDetail
  goToStep: (step: ReviewStep) => void
  /** A completed stage reopened for viewing: content is not editable. */
  readOnly?: boolean
}) {
  const { t } = useI18n(reviewInfoStageMessages)

  return (
    <div className="odm-or-review-stage" aria-label={t.orderInformation}>
      <ReadOnlyScope on={readOnly}>
        <OrderServiceInfo order={order} />
        <OrderCustomerRequestDetails order={order} />
      </ReadOnlyScope>
      <ReviewStageActions step={1} onNext={() => goToStep(2)} />
    </div>
  )
}
