import type { OrderDetail } from '../../../types/orders'
import { ReviewStageStepper } from './ReviewStageStepper'
import { OrderServiceBanner } from './OrderServiceBanner'
import { orderDeliverableLabels } from '../orderDeliverableLabels'
import { REVIEW_STEPS, type ReviewStep } from '../reviewSteps'
import { useI18n } from '../../../../../shared/i18n'
import { reviewTopMessages } from './ReviewTop.messages'

export function ReviewTop({
  title,
  subtitle,
  reviewStep,
  goToStep,
  order,
}: {
  title: string
  subtitle: string
  reviewStep: ReviewStep
  goToStep: (step: ReviewStep) => void
  order: OrderDetail
}) {
  const { t, locale } = useI18n(reviewTopMessages)
  return (
    <div className="odm-or-review-top">
      <div className="odm-or-pagehead">
        <h1 className="odm-or-title">{title}</h1>
        <p className="odm-or-subtitle">{subtitle}</p>
      </div>
      <ReviewStageStepper currentStep={reviewStep} onChange={goToStep} />
      <OrderServiceBanner
        serviceName={order.serviceName}
        serviceDescription={order.serviceDescription}
        currentStep={reviewStep}
        totalSteps={REVIEW_STEPS.length}
        deliverables={orderDeliverableLabels(order, locale)}
        eyebrow={t.serviceEyebrow}
        stepLabel={(cur, total) => `${t.stepWord} ${cur}/${total}`}
      />
    </div>
  )
}
