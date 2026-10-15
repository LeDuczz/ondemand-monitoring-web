import { useRef, useState } from 'react'

import { ApiError } from '../../../../shared/api/httpClient'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { ordersApi } from '../../api/ordersApi'
import { readinessApi } from '../../api/readinessApi'
import { managerHref } from '../../routes'
import { OrderMissionPlanningSection } from './components/OrderMissionPlanningSection'
import { OrderResourceAssignmentWizard } from '../../components/common/OrderResourceAssignmentWizard'
import '../../manager.css'
import { type ReviewStep } from './reviewSteps'
import { ReviewBreadcrumbHeader } from './components/ReviewBreadcrumbHeader'
import { ReviewSkeleton } from './components/ReviewSkeleton'
import { ReviewLoadError } from './components/ReviewLoadError'
import { ReviewTop } from './components/ReviewTop'
import { ReviewInfoStage } from './components/ReviewInfoStage'
import { ReviewAreaStage } from './components/ReviewAreaStage'
import { ReviewReadinessStage } from './components/ReviewReadinessStage'
import { ReviewDecisionStage } from './components/ReviewDecisionStage'
import { useI18n } from '../../../../shared/i18n'
import { orderReviewPageMessages } from './OrderReviewPage.messages'

export function OrderReviewPage({ orderId }: { orderId: string }) {
  const { t } = useI18n(orderReviewPageMessages)

  const orderQuery = useApiQuery(
    (signal) => ordersApi.getOrder(orderId, signal),
    [orderId],
  )
  const readinessQuery = useApiQuery(
    (signal) => readinessApi.get(orderId, signal),
    [orderId],
  )

  const [navigateHome, setNavigateHome] = useState(false)
  const [reviewStep, setReviewStep] = useState<ReviewStep>(1)
  const pageRef = useRef<HTMLDivElement>(null)
  const [assigningMissionId, setAssigningMissionId] = useState<string | null>(
    null,
  )

  if (navigateHome) {
    window.location.hash = managerHref({ screen: 'orderQueue' })
    return null
  }

  if (assigningMissionId)
    return (
      <OrderResourceAssignmentWizard
        orderId={orderId}
        initialMissionId={assigningMissionId}
        onClose={() => {
          setAssigningMissionId(null)
          orderQuery.reload()
        }}
      />
    )
  if (orderQuery.loading) return <ReviewSkeleton orderId={orderId} />

  if (orderQuery.error) {
    const is409 =
      orderQuery.error instanceof ApiError && orderQuery.error.status === 409
    return (
      <div className="odm-mgr-dash">
        <ReviewBreadcrumbHeader orderId={orderId} />
        <ReviewLoadError is409={is409} />
      </div>
    )
  }

  const order = orderQuery.data
  if (!order) return null
  const showExecutionPlan = ['APPROVED', 'IN_PROGRESS', 'COMPLETED'].includes(
    order.status,
  )

  const goToStep = (step: ReviewStep) => {
    setReviewStep(step)
    // Each step is a long page; start the next one from the top.
    pageRef.current?.scrollIntoView?.({ block: 'start' })
  }

  const handleApproved = () => {
    // Approval enters Order planning. A legacy missionId must not skip checklist/finalization.
    orderQuery.reload()
    readinessQuery.reload()
  }

  // The backend enforces the same criteria; this only keeps the button honest.
  const readiness = readinessQuery.data
  const approveBlockedReason =
    order.status === 'PENDING' && readiness && !readiness.canApprove
      ? t.notReadyForApproval(readiness.blockingReasons.join('; '))
      : null
  const pendingRequired =
    readiness?.criteria.filter(
      (c) => c.type === 'MANUAL' && c.required && c.result === 'PENDING',
    ).length ?? 0

  return (
    <div className="odm-or odm-or-review-page" ref={pageRef}>
      {!showExecutionPlan && (
        <ReviewTop
          title={t.pageTitle}
          subtitle={t.pageSubtitle}
          reviewStep={reviewStep}
          goToStep={goToStep}
          order={order}
        />
      )}
      {showExecutionPlan && (
        <OrderMissionPlanningSection
          orderId={order.id}
          initialOrder={order}
          onAssignResources={setAssigningMissionId}
        />
      )}
      {!showExecutionPlan && reviewStep === 1 ? (
        <ReviewInfoStage order={order} goToStep={goToStep} />
      ) : null}

      {!showExecutionPlan && reviewStep === 2 ? (
        <ReviewAreaStage order={order} goToStep={goToStep} />
      ) : null}

      {!showExecutionPlan && reviewStep === 3 ? (
        <ReviewReadinessStage
          order={order}
          readinessQuery={readinessQuery}
          goToStep={goToStep}
          pendingRequired={pendingRequired}
        />
      ) : null}

      {!showExecutionPlan && reviewStep === 4 ? (
        <ReviewDecisionStage
          order={order}
          handleApproved={handleApproved}
          readinessQuery={readinessQuery}
          approveBlockedReason={approveBlockedReason}
          setNavigateHome={setNavigateHome}
          goToStep={goToStep}
        />
      ) : null}
    </div>
  )
}
