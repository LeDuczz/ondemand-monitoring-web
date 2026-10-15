import { useEffect, useRef, useState } from 'react'

import { ApiError } from '../../../../shared/api/httpClient'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { getOrderStatusLabel } from '../../../../shared/lib/statusTone'
import { ordersApi } from '../../api/ordersApi'
import { readinessApi } from '../../api/readinessApi'
import { managerHref } from '../../routes'
import type { FlightAreaReviewStatus } from '../../types/orders'
import { OrderMissionPlanningSection } from './components/OrderMissionPlanningSection'
import type { PlanningWorkflowInfo } from './planningWorkspaceData'
import { OrderResourceAssignmentWizard } from '../../components/common/OrderResourceAssignmentWizard'
import { WorkflowStepper } from '../../components/common/WorkflowStepper'
import {
  orderProgress,
  orderStageToReviewStep,
  type OrderStage,
} from '../../components/common/workflowModel'
import '../../manager.css'
import { type ReviewStep } from './reviewSteps'
import { missionLayer } from './missionLayer'
import { ReviewHeader } from './components/ReviewHeader'
import { OrderStatusCard } from './components/OrderStatusCard'
import { InternalNoteCard } from './components/InternalNoteCard'
import { OrderCustomerCard } from '../../components/common/OrderCustomerCard'
import { OrderAttachmentsCard } from '../../components/common/OrderAttachmentsCard'
import { ReviewSkeleton } from './components/ReviewSkeleton'
import { ReviewLoadError } from './components/ReviewLoadError'
import { ReviewInfoStage } from './components/ReviewInfoStage'
import { ReviewAreaStage } from './components/ReviewAreaStage'
import { ReviewReadinessStage } from './components/ReviewReadinessStage'
import { ReviewDecisionStage } from './components/ReviewDecisionStage'
import { useI18n, useLanguage } from '../../../../shared/i18n'
import { orderReviewPageMessages } from './OrderReviewPage.messages'

export function OrderReviewPage({ orderId }: { orderId: string }) {
  const { t } = useI18n(orderReviewPageMessages)
  const { locale, lang } = useLanguage()

  const orderQuery = useApiQuery(
    (signal) => ordersApi.getOrder(orderId, signal),
    [orderId],
  )
  const readinessQuery = useApiQuery(
    (signal) => readinessApi.get(orderId, signal),
    [orderId],
  )

  const [navigateHome, setNavigateHome] = useState(false)
  const [assignStep, setAssignStep] = useState<6 | 7 | 8>(6)
  const [reviewStep, setReviewStep] = useState<ReviewStep>(1)
  const [areaReviewStatus, setAreaReviewStatus] =
    useState<FlightAreaReviewStatus | null>(null)
  // A completed Order stage reopened read-only; null = the live (current) screen.
  const [viewStage, setViewStage] = useState<OrderStage | null>(null)
  const [planning, setPlanning] = useState<PlanningWorkflowInfo | null>(null)
  const pageRef = useRef<HTMLDivElement>(null)
  const [assigningMissionId, setAssigningMissionId] = useState<string | null>(
    null,
  )

  useEffect(() => {
    setAreaReviewStatus(orderQuery.data?.flightAreaReviewStatus ?? null)
  }, [orderQuery.data])

  if (navigateHome) {
    window.location.hash = managerHref({ screen: 'orderQueue' })
    return null
  }

  if (assigningMissionId && orderQuery.data)
    return (
      <div className="odm-or odm-or-review-page">
        <ReviewHeader orderId={orderId} order={orderQuery.data} />
        <WorkflowStepper
          order={{
            progress: { current: 'complete', waiting: false, terminal: null },
          }}
          mission={missionLayer(
            planning,
            assigningMissionId,
            lang,
            assignStep >= 8 ? 'review' : 'resources',
          )}
        />
        <OrderResourceAssignmentWizard
          orderId={orderId}
          initialMissionId={assigningMissionId}
          embedded
          returnLabel={t.finalizePlan}
          onStepChange={setAssignStep}
          onClose={() => {
            setAssigningMissionId(null)
            orderQuery.reload()
          }}
        />
      </div>
    )
  if (orderQuery.loading) return <ReviewSkeleton orderId={orderId} />

  if (orderQuery.error) {
    const is409 =
      orderQuery.error instanceof ApiError && orderQuery.error.status === 409
    return (
      <div className="odm-or">
        <ReviewHeader orderId={orderId} />
        <ReviewLoadError is409={is409} />
      </div>
    )
  }

  const order = orderQuery.data
  if (!order) return null
  const showExecutionPlan = ['APPROVED', 'IN_PROGRESS', 'COMPLETED'].includes(
    order.status,
  )

  // Until the planning data arrives assume the deposit is paid, so the header
  // never flashes "waiting for deposit" for an order that is already funded.
  const stepperProgress = orderProgress({
    status: order.status,
    depositPaid: planning ? planning.depositPaid : true,
    reviewStep,
  })
  const readOnly = showExecutionPlan
  const reviewing = !showExecutionPlan || viewStage !== null
  const openStage = (stage: OrderStage) => {
    const step = orderStageToReviewStep(stage)
    if (!step) return
    setReviewStep(step)
    setViewStage(stage)
    pageRef.current?.scrollIntoView?.({ block: 'start' })
  }

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
      <ReviewHeader orderId={orderId} order={order} />
      <WorkflowStepper
        order={{
          progress: stepperProgress,
          statusLabel: getOrderStatusLabel(order.status, lang),
          viewing: viewStage,
          onSelect: (stage) =>
            showExecutionPlan
              ? openStage(stage)
              : goToStep(orderStageToReviewStep(stage) ?? 1),
          // Before approval the three review stages stay freely navigable;
          // afterwards only completed stages reopen (read-only).
          selectable: (stage, state) =>
            orderStageToReviewStep(stage) !== null &&
            (showExecutionPlan ? state === 'done' : true),
        }}
        mission={
          showExecutionPlan && planning?.depositPaid && planning.missions.length
            ? missionLayer(planning, planning.selectedMissionId, lang)
            : undefined
        }
      />
      <div
        className={`odm-or-layout${reviewing && reviewStep === 4 ? ' is-wide' : ''}`}
      >
        <div className="odm-or-main">
          {showExecutionPlan && (
            // Stays mounted while history is open so unsaved planning drafts survive.
            <div hidden={viewStage !== null}>
              <OrderMissionPlanningSection
                orderId={order.id}
                initialOrder={order}
                onAssignResources={setAssigningMissionId}
                onWorkflowInfo={setPlanning}
              />
            </div>
          )}
          {readOnly && viewStage !== null && (
            <div className="odm-or-readonly-banner" role="status">
              <strong>{t.readonlyTitle}</strong>
              <span>{t.readonlyBody}</span>
              <button
                type="button"
                className="odm-btn odm-btn-p"
                onClick={() => setViewStage(null)}
              >
                {t.readonlyBack}
              </button>
            </div>
          )}
          {reviewing && (
            <>
              {reviewStep === 1 ? (
                <ReviewInfoStage
                  order={order}
                  goToStep={goToStep}
                  readOnly={readOnly}
                />
              ) : null}

              {reviewStep === 2 ? (
                <ReviewAreaStage
                  order={order}
                  goToStep={goToStep}
                  readOnly={readOnly}
                  areaReviewStatus={areaReviewStatus}
                  onReviewSaved={setAreaReviewStatus}
                />
              ) : null}

              {reviewStep === 3 ? (
                <ReviewReadinessStage
                  order={order}
                  readinessQuery={readinessQuery}
                  goToStep={goToStep}
                  pendingRequired={pendingRequired}
                  readOnly={readOnly}
                  onDecisionDone={() => setNavigateHome(true)}
                />
              ) : null}

              {reviewStep === 4 ? (
                <ReviewDecisionStage
                  order={order}
                  handleApproved={handleApproved}
                  readinessQuery={readinessQuery}
                  approveBlockedReason={approveBlockedReason}
                  setNavigateHome={setNavigateHome}
                  goToStep={goToStep}
                  readOnly={readOnly}
                />
              ) : null}
            </>
          )}
        </div>
        <aside className="odm-or-side">
          <OrderStatusCard order={order} locale={locale} />
          <OrderCustomerCard order={order} />
          <OrderAttachmentsCard order={order} />
          <InternalNoteCard orderId={order.id} locale={locale} />
        </aside>
      </div>
    </div>
  )
}
