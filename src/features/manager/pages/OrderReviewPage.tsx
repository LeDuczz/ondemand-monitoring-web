import { useEffect, useRef, useState, type ReactNode } from 'react'

import { ApiError } from '../../../shared/api/httpClient'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../shared/i18n'
import {
  getMissionStatusLabel,
  getOrderStatusLabel,
} from '../../../shared/lib/statusTone'
import { ordersApi } from '../api/ordersApi'
import { InternalNoteCard } from '../components/orderReview/InternalNoteCard'
import { OrderAttachmentsCard } from '../components/orderReview/OrderAttachmentsCard'
import { OrderCustomerCard } from '../components/orderReview/OrderCustomerCard'
import { OrderReadinessCard } from '../components/orderReview/OrderReadinessCard'
import { readinessApi } from '../api/readinessApi'
import { OrderCustomerRequestDetails } from '../components/orderReview/OrderCustomerRequestDetails'
import { OrderAreaCheck } from '../components/orderReview/OrderAreaCheck'
import { OrderServiceInfo } from '../components/orderReview/OrderServiceInfo'
import {
  OrderServiceBanner,
  orderDeliverableLabels,
} from '../components/orderReview/OrderServiceBanner'
import { OrderStatusCard } from '../components/orderReview/OrderStatusCard'
import { OrderBannerMeta } from '../components/orderReview/OrderBannerMeta'
import { managerHref } from '../routes'
import {
  OrderMissionPlanningSection,
  type PlanningWorkflowInfo,
} from '../components/planning/OrderMissionPlanningSection'
import { WorkflowStepper } from '../components/workflow/WorkflowStepper'
import {
  missionProgress,
  orderProgress,
  orderStageToReviewStep,
  type OrderStage,
} from '../components/workflow/workflowModel'
import { OrderResourceAssignmentWizard } from '../components/planning/OrderResourceAssignmentWizard'
import {
  orderReviewPageMessages,
  type OrderReviewMessages,
} from './OrderReviewPage.messages'
import { ManagerPricingPanel } from '../../finance/ManagerPricingPanel'
import '../manager.css'
import type { LegalReviewStatus } from '../types/orders'

type PageMessages = OrderReviewMessages
type ReviewStep = 1 | 2 | 3 | 4

export function OrderReviewPage({ orderId }: { orderId: string }) {
  const { t, locale, lang } = useI18n(orderReviewPageMessages)
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
    useState<LegalReviewStatus | null>(null)
  // A completed Order stage reopened read-only; null = the live (current) screen.
  const [viewStage, setViewStage] = useState<OrderStage | null>(null)
  const [planning, setPlanning] = useState<PlanningWorkflowInfo | null>(null)
  const pageRef = useRef<HTMLDivElement>(null)
  const [assigningMissionId, setAssigningMissionId] = useState<string | null>(
    null,
  )
  useEffect(() => {
    setAreaReviewStatus(orderQuery.data?.legalReviewStatus ?? null)
  }, [orderQuery.data])
  if (navigateHome) {
    window.location.hash = managerHref({ screen: 'orderQueue' })
    return null
  }

  if (assigningMissionId && orderQuery.data)
    return (
      <div className="odm-or odm-or-review-page">
        <div className="odm-or-review-top">
          <div className="odm-or-pagehead">
            <h1 className="odm-or-title">Chi tiết đơn hàng</h1>
            <p className="odm-or-subtitle">
              Gán nhân sự và thiết bị cho Mission đã lên lịch
            </p>
          </div>
          <WorkflowStepper
            compactOrder
            order={{
              progress: { current: 'complete', waiting: false, terminal: null },
            }}
            mission={missionLayer(
              planning,
              assigningMissionId === '__select_mission__'
                ? null
                : assigningMissionId,
              lang,
              assignStep >= 8 ? 'review' : 'resources',
            )}
          />
          <div className="odm-assign-context" aria-label={t.serviceEyebrow}>
            <strong>{orderQuery.data.serviceName}</strong>
            {orderDeliverableLabels(orderQuery.data, locale).length > 0 && (
              <span>
                {t.deliverableFormat}:{' '}
                {orderDeliverableLabels(orderQuery.data, locale).join(', ')}
              </span>
            )}
          </div>
        </div>
        <OrderResourceAssignmentWizard
          orderId={orderId}
          initialMissionId={
            assigningMissionId === '__select_mission__'
              ? undefined
              : assigningMissionId
          }
          embedded
          returnLabel="Hoàn tất phân công"
          onStepChange={setAssignStep}
          onClose={() => {
            setAssigningMissionId(null)
            orderQuery.reload()
          }}
        />
      </div>
    )
  if (orderQuery.loading) return <ReviewSkeleton orderId={orderId} t={t} />

  if (orderQuery.error) {
    const is409 =
      orderQuery.error instanceof ApiError && orderQuery.error.status === 409
    return (
      <div className="odm-mgr-dash">
        <ReviewBreadcrumbHeader orderId={orderId} t={t} />
        <div className="odm-card">
          <div className="odm-mgr-review-error">
            <div className="odm-mgr-review-error-icon" aria-hidden="true">
              !
            </div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{t.loadError}</div>
            <div
              style={{ color: 'var(--tx3)', maxWidth: 420, lineHeight: 1.5 }}
            >
              {is409 ? t.error409 : t.errorGeneric}
            </div>
            <a
              className="odm-btn odm-btn-p"
              href={managerHref({ screen: 'orderQueue' })}
            >
              {t.backToQueue}
            </a>
          </div>
        </div>
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
      ? `Chưa đủ điều kiện duyệt: ${readiness.blockingReasons.join('; ')}`
      : null
  const pendingRequired =
    readiness?.criteria.filter(
      (c) => c.type === 'MANUAL' && c.required && c.result === 'PENDING',
    ).length ?? 0

  return (
    <div className="odm-or odm-or-review-page" ref={pageRef}>
      <div className="odm-or-review-top">
        {!showExecutionPlan && (
          <div className="odm-or-pagehead">
            <h1 className="odm-or-title">{t.pageTitle}</h1>
            <p className="odm-or-subtitle">{t.pageSubtitle}</p>
          </div>
        )}
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
        <OrderServiceBanner
          serviceName={order.serviceName}
          serviceDescription={order.serviceDescription}
          deliverables={orderDeliverableLabels(order, locale)}
          deliverablesLabel={t.deliverableFormat}
          eyebrow={t.serviceEyebrow}
          meta={<OrderBannerMeta order={order} locale={locale} />}
        />
      </div>
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
          <strong>Bạn đang xem lại bước đã hoàn thành</strong>
          <span>
            Thông tin này đã được xác nhận và hiện chỉ có thể xem.
          </span>
          <button
            type="button"
            className="odm-btn odm-btn-p"
            onClick={() => setViewStage(null)}
          >
            Quay lại bước hiện tại
          </button>
        </div>
      )}
      {reviewing && reviewStep === 1 ? (
        <div className="odm-or-review-stage" aria-label="Thông tin đơn">
          <ReadOnlyScope on={readOnly}>
          <section className="odm-or-grid odm-or-review-summary">
            <div className="odm-or-col">
              <OrderServiceInfo order={order} t={t} hideService />
              <OrderCustomerRequestDetails order={order} t={t} />
            </div>
            <div className="odm-or-col odm-or-summary-side">
              <OrderStatusCard order={order} t={t} locale={locale} />
              <OrderCustomerCard order={order} t={t} />
            </div>
          </section>
          <section className="odm-or-grid odm-or-review-more">
            <div className="odm-or-col">
              <OrderAttachmentsCard order={order} t={t} />
              <InternalNoteCard orderId={order.id} t={t} locale={locale} />
            </div>
          </section>
          </ReadOnlyScope>
          <ReviewStageActions step={1} onNext={() => goToStep(2)} />
        </div>
      ) : null}

      {reviewing && reviewStep === 2 ? (
        <div className="odm-or-review-stage" aria-label="Kiểm tra vùng giám sát">
          <ReadOnlyScope on={readOnly}>
            <OrderAreaCheck
              order={order}
              t={t}
              onReviewSaved={setAreaReviewStatus}
            />
          </ReadOnlyScope>
          <ReviewStageActions
            step={2}
            onBack={() => goToStep(1)}
            onNext={() => goToStep(3)}
            nextLabel="Tiếp: Điều kiện duyệt"
            nextDisabled={
              areaReviewStatus !== 'NOT_REQUIRED' &&
              areaReviewStatus !== 'APPROVED'
            }
            hint={
              areaReviewStatus == null
                ? 'Manager cần đánh giá khu vực trước khi tiếp tục'
                : areaReviewStatus === 'PENDING_PERMIT'
                  ? 'Đang xác minh giấy phép ngoài hệ thống; chưa thể duyệt hoặc thanh toán'
                  : areaReviewStatus === 'REJECTED'
                    ? 'Hãy yêu cầu khách đổi khu vực hoặc từ chối đơn'
                    : null
            }
          />
        </div>
      ) : null}

      {reviewing && reviewStep === 3 ? (
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
      ) : null}

      {reviewing && reviewStep === 4 ? (
        <div className="odm-or-review-stage" aria-label="Checklist và báo giá">
          <ReadOnlyScope on={readOnly}>
          <section className="odm-or-review-section">
            <ManagerPricingPanel
              orderId={order.id}
              onApproved={handleApproved}
              onChecklistReviewChanged={readinessQuery.reload}
              approveBlockedReason={approveBlockedReason}
            />
          </section>
          </ReadOnlyScope>
          <ReviewStageActions step={4} onBack={() => goToStep(3)} />
        </div>
      ) : null}
    </div>
  )
}

const REVIEW_PAGE_COUNT = 4

/** Completed stages stay readable but cannot be edited: a disabled fieldset covers every control inside. */
function ReadOnlyScope({ on, children }: { on: boolean; children: ReactNode }) {
  return on ? (
    <fieldset className="odm-or-readonly" disabled>
      {children}
    </fieldset>
  ) : (
    <>{children}</>
  )
}

/** Mission row of the workflow header: which Mission, its business status, and where it is. */
function missionLayer(
  planning: PlanningWorkflowInfo | null,
  missionId: string | null,
  lang: 'vi' | 'en',
  stage?: 'resources' | 'review',
) {
  const total = planning?.missions.length
  const index = planning?.missions.findIndex((m) => m.id === missionId) ?? -1
  const mission = index >= 0 ? planning?.missions[index] : undefined
  const progress = mission ? missionProgress(mission.status) : null
  return {
    progress:
      stage === 'resources'
        ? { current: 'resources' as const, finished: false, terminal: null }
        : stage === 'review'
          ? { current: 'prepare' as const, finished: false, terminal: null }
          : progress,
    index: mission ? index + 1 : undefined,
    total: mission ? total : undefined,
    code: mission?.code,
    statusLabel: mission ? getMissionStatusLabel(mission.status, lang) : undefined,
  }
}

function ReviewStageActions({
  step,
  onBack,
  onNext,
  nextLabel = 'Tiếp: Điều kiện duyệt',
  hint,
  nextDisabled = false,
}: {
  step: ReviewStep
  onBack?: () => void
  onNext?: () => void
  nextLabel?: string
  hint?: string | null
  nextDisabled?: boolean
}) {
  return (
    <div className="odm-or-review-stage-actions">
      {onBack ? (
        <button type="button" className="odm-btn" onClick={onBack}>
          Quay lại
        </button>
      ) : null}
      <span className="odm-or-review-stage-progress">
        Bước {step}/{REVIEW_PAGE_COUNT}
      </span>
      {hint ? (
        <span className="odm-or-review-stage-hint" role="status">
          {hint}
        </span>
      ) : null}
      {onNext ? (
        <button type="button" className="odm-btn odm-btn-p" onClick={onNext} disabled={nextDisabled}>
          {nextLabel}
        </button>
      ) : null}
    </div>
  )
}

function ReviewBreadcrumbHeader({
  orderId,
  t,
}: {
  orderId: string
  t: PageMessages
}) {
  return (
    <div className="odm-mgr-review-breadcrumb">
      <a href={managerHref({ screen: 'orderQueue' })}>{t.breadcrumb}</a>
      <span aria-hidden="true">/</span>
      <span>{orderId}</span>
    </div>
  )
}

function ReviewSkeleton({ orderId, t }: { orderId: string; t: PageMessages }) {
  return (
    <div className="odm-or" aria-busy="true" aria-live="polite">
      <ReviewBreadcrumbHeader orderId={orderId} t={t} />
      <span className="odm-sk" style={{ width: '100%', height: 68 }} />
      <div className="odm-or-grid">
        <div className="odm-or-col">
          <span className="odm-sk" style={{ width: '100%', height: 400 }} />
          <span className="odm-sk" style={{ width: '100%', height: 220 }} />
        </div>
        <div className="odm-or-col">
          <span className="odm-sk" style={{ width: '100%', height: 170 }} />
          <span className="odm-sk" style={{ width: '100%', height: 150 }} />
          <span className="odm-sk" style={{ width: '100%', height: 150 }} />
        </div>
      </div>
      <span className="odm-visually-hidden">{t.loading}</span>
    </div>
  )
}
