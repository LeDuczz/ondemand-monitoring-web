import { ReadOnlyScope } from './ReadOnlyScope'
import { OrderReadinessCard } from './OrderReadinessCard'
import { ReviewStageActions } from './ReviewStageActions'
import type { OrderDetail } from '../../../types/orders'
import type { UseApiQueryState } from '../../../../../shared/hooks/useApiQuery'
import type { OrderReadiness } from '../../../types/readiness'
import type { Dispatch, SetStateAction } from 'react'
import type { ReviewStep } from '../reviewTypes'

export function ReviewStageReadiness({
  readOnly,
  order,
  readinessQuery,
  setNavigateHome,
  goToStep,
  pendingRequired,
}: {
  readOnly: boolean
  order: OrderDetail
  readinessQuery: UseApiQueryState<OrderReadiness>
  setNavigateHome: Dispatch<SetStateAction<boolean>>
  goToStep: (step: ReviewStep) => void
  pendingRequired: number
}) {
  return (
    <div className="odm-or-review-stage" aria-label="Điều kiện duyệt">
      <ReadOnlyScope on={readOnly}>
        <section className="odm-or-review-section">
          <OrderReadinessCard
            orderId={order.id}
            query={readinessQuery}
            editable={order.status === 'PENDING'}
            onDecisionDone={() => setNavigateHome(true)}
          />
        </section>
      </ReadOnlyScope>
      <ReviewStageActions
        step={3}
        onBack={() => goToStep(2)}
        onNext={() => goToStep(4)}
        nextLabel="Tiếp: Checklist & báo giá"
        hint={
          order.status === 'PENDING' && pendingRequired > 0
            ? `Còn ${pendingRequired} mục bắt buộc chưa xác nhận — chưa thể duyệt báo giá`
            : null
        }
      />
    </div>
  )
}
