import { useRef, useState } from 'react'

import { ApiError } from '../../../shared/api/httpClient'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../shared/i18n'
import { ordersApi } from '../api/ordersApi'
import { InternalNoteCard } from '../components/orderReview/InternalNoteCard'
import { OrderApprovalActions } from '../components/orderReview/OrderApprovalActions'
import { OrderAttachmentsCard } from '../components/orderReview/OrderAttachmentsCard'
import { OrderCustomerCard } from '../components/orderReview/OrderCustomerCard'
import { OrderReadinessCard } from '../components/orderReview/OrderReadinessCard'
import { readinessApi } from '../api/readinessApi'
import { OrderIcon } from '../components/orderReview/OrderIcon'
import { OrderCustomerRequestDetails } from '../components/orderReview/OrderCustomerRequestDetails'
import { OrderAreaCheck } from '../components/orderReview/OrderAreaCheck'
import { OrderServiceInfo } from '../components/orderReview/OrderServiceInfo'
import {
  OrderServiceBanner,
  orderDeliverableLabels,
} from '../components/orderReview/OrderServiceBanner'
import { OrderStatusCard } from '../components/orderReview/OrderStatusCard'
import { managerHref } from '../routes'
import { OrderMissionPlanningSection } from '../components/planning/OrderMissionPlanningSection'
import { OrderResourceAssignmentWizard } from '../components/planning/OrderResourceAssignmentWizard'
import {
  orderReviewPageMessages,
  type OrderReviewMessages,
} from './OrderReviewPage.messages'
import { ManagerPricingPanel } from '../../finance/ManagerPricingPanel'
import '../manager.css'

type PageMessages = OrderReviewMessages
type ReviewStep = 1 | 2 | 3 | 4

export function OrderReviewPage({ orderId }: { orderId: string }) {
  const { t, locale } = useI18n(orderReviewPageMessages)
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
      {!showExecutionPlan && (
        <div className="odm-or-review-top">
          <div className="odm-or-pagehead">
            <h1 className="odm-or-title">{t.pageTitle}</h1>
            <p className="odm-or-subtitle">{t.pageSubtitle}</p>
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
      )}
      {showExecutionPlan && (
        <OrderMissionPlanningSection
          orderId={order.id}
          initialOrder={order}
          onAssignResources={setAssigningMissionId}
        />
      )}
      {!showExecutionPlan && reviewStep === 1 ? (
        <div className="odm-or-review-stage" aria-label="Thông tin đơn">
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
          <ReviewStageActions step={1} onNext={() => goToStep(2)} />
        </div>
      ) : null}

      {!showExecutionPlan && reviewStep === 2 ? (
        <div className="odm-or-review-stage" aria-label="Kiểm tra vùng giám sát">
          <OrderAreaCheck order={order} t={t} />
          <ReviewStageActions
            step={2}
            onBack={() => goToStep(1)}
            onNext={() => goToStep(3)}
            nextLabel="Tiếp: Điều kiện duyệt"
          />
        </div>
      ) : null}

      {!showExecutionPlan && reviewStep === 3 ? (
        <div className="odm-or-review-stage" aria-label="Điều kiện duyệt">
          <section className="odm-or-review-section">
            <OrderReadinessCard
              orderId={order.id}
              query={readinessQuery}
              editable={order.status === 'PENDING'}
            />
          </section>
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

      {!showExecutionPlan && reviewStep === 4 ? (
        <div className="odm-or-review-stage" aria-label="Checklist và báo giá">
          <section className="odm-or-review-section">
            <ManagerPricingPanel
              orderId={order.id}
              onApproved={handleApproved}
              onChecklistReviewChanged={readinessQuery.reload}
              approveBlockedReason={approveBlockedReason}
              decisionActions={
                <OrderApprovalActions
                  orderId={order.id}
                  orderCode={order.code}
                  t={t}
                  onApproved={handleApproved}
                  onDecisionDone={() => setNavigateHome(true)}
                  showApprove={false}
                />
              }
            />
          </section>
          <ReviewStageActions step={4} onBack={() => goToStep(3)} />
        </div>
      ) : null}
    </div>
  )
}

const REVIEW_STEPS: Array<{
  number: number
  label: string
  hint: string
  reviewStep?: ReviewStep
}> = [
  { number: 1, label: 'Thông tin đơn', hint: 'Hồ sơ và vị trí', reviewStep: 1 },
  {
    number: 2,
    label: 'Kiểm tra vùng',
    hint: 'Bản đồ và cảnh báo',
    reviewStep: 2,
  },
  {
    number: 3,
    label: 'Điều kiện duyệt',
    hint: 'Kiểm tra và xác nhận',
    reviewStep: 3,
  },
  {
    number: 4,
    label: 'Checklist & báo giá',
    hint: 'Phân loại và quyết định',
    reviewStep: 4,
  },
  { number: 5, label: 'Lên lịch', hint: 'Thời gian thực hiện' },
  { number: 6, label: 'Gán nguồn lực', hint: 'Thiết bị và nhân sự' },
  { number: 7, label: 'Xác nhận', hint: 'Hoàn tất kế hoạch' },
]

function ReviewStageStepper({
  currentStep,
  onChange,
}: {
  currentStep: ReviewStep
  onChange: (step: ReviewStep) => void
}) {
  return (
    <nav
      className="odm-or-card odm-or-review-stepper"
      aria-label="Các bước review đơn"
    >
      <ol>
        {REVIEW_STEPS.map((step) => {
          const state = !step.reviewStep
            ? 'locked'
            : step.number < currentStep
              ? 'done'
              : step.number === currentStep
                ? 'current'
                : 'todo'
          return (
            <li key={step.number} className={`is-${state}`}>
              <button
                type="button"
                className="odm-or-review-step"
                aria-current={state === 'current' ? 'step' : undefined}
                disabled={!step.reviewStep}
                title={
                  !step.reviewStep
                    ? 'Hoàn tất duyệt đơn để mở bước này'
                    : undefined
                }
                onClick={() => step.reviewStep && onChange(step.reviewStep)}
              >
                <span className="odm-or-review-step-dot">
                  {state === 'done' ? (
                    <OrderIcon name="check" size={16} />
                  ) : (
                    step.number
                  )}
                </span>
                <span className="odm-or-review-step-text">
                  <strong>{step.label}</strong>
                  <small>{step.hint}</small>
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

function ReviewStageActions({
  step,
  onBack,
  onNext,
  nextLabel = 'Tiếp: Điều kiện duyệt',
  hint,
}: {
  step: ReviewStep
  onBack?: () => void
  onNext?: () => void
  nextLabel?: string
  hint?: string | null
}) {
  return (
    <div className="odm-or-review-stage-actions">
      {onBack ? (
        <button type="button" className="odm-btn" onClick={onBack}>
          Quay lại
        </button>
      ) : null}
      <span className="odm-or-review-stage-progress">
        Bước {step}/{REVIEW_STEPS.length}
      </span>
      {hint ? (
        <span className="odm-or-review-stage-hint" role="status">
          {hint}
        </span>
      ) : null}
      {onNext ? (
        <button type="button" className="odm-btn odm-btn-p" onClick={onNext}>
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
