import { useState } from 'react'

import { ApiError } from '../../../shared/api/httpClient'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../shared/i18n'
import { ordersApi } from '../api/ordersApi'
import { InternalNoteCard } from '../components/orderReview/InternalNoteCard'
import { OrderApprovalActions } from '../components/orderReview/OrderApprovalActions'
import { OrderAttachmentsCard } from '../components/orderReview/OrderAttachmentsCard'
import { OrderCustomerCard } from '../components/orderReview/OrderCustomerCard'
import { OrderLocationCard } from '../components/orderReview/OrderLocationCard'
import { OrderServiceInfo } from '../components/orderReview/OrderServiceInfo'
import { OrderChecklistCard } from '../components/orderReview/OrderChecklistCard'
import { OrderStatusCard } from '../components/orderReview/OrderStatusCard'
import { ResourceAvailabilityCard } from '../components/orderReview/ResourceAvailabilityCard'
import { OrderWorkflowStepper } from '../components/OrderWorkflowStepper'
import { managerHref } from '../routes'
import { OrderMissionPlanningSection } from '../components/planning/OrderMissionPlanningSection'
import { OrderResourceAssignmentWizard } from '../components/planning/OrderResourceAssignmentWizard'
import {
  orderReviewPageMessages,
  type OrderReviewMessages,
} from './OrderReviewPage.messages'
import '../manager.css'

type PageMessages = OrderReviewMessages

export function OrderReviewPage({ orderId }: { orderId: string }) {
  const { t, locale } = useI18n(orderReviewPageMessages)
  const orderQuery = useApiQuery(
    (signal) => ordersApi.getOrder(orderId, signal),
    [orderId],
  )
  const previewQuery = useApiQuery(
    (signal) => ordersApi.getResourcePreview(orderId, signal),
    [orderId],
  )

  const [navigateHome, setNavigateHome] = useState(false)
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
          previewQuery.reload()
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

  const handleApproved = () => {
    // Approval enters Order planning. A legacy missionId must not skip checklist/finalization.
    orderQuery.reload()
    previewQuery.reload()
  }

  return (
    <div className="odm-or">
      {!showExecutionPlan && (
        <div className="odm-or-pagehead">
          <h1 className="odm-or-title">{t.pageTitle}</h1>
          <p className="odm-or-subtitle">{t.pageSubtitle}</p>
        </div>
      )}

      {!showExecutionPlan && <OrderWorkflowStepper currentStep={1} />}

      {showExecutionPlan && (
        <OrderMissionPlanningSection
          orderId={order.id}
          initialOrder={order}
          onAssignResources={setAssigningMissionId}
        />
      )}

      <div className="odm-or-grid">
        <div className="odm-or-col">
          <OrderLocationCard order={order} t={t} />
          <OrderServiceInfo order={order} t={t} />
          <OrderChecklistCard order={order} t={t} />
          <OrderAttachmentsCard order={order} t={t} />
        </div>
        <div className="odm-or-col">
          <OrderCustomerCard order={order} t={t} />
          <OrderStatusCard order={order} t={t} locale={locale} />
          <ResourceAvailabilityCard query={previewQuery} t={t} />
          <InternalNoteCard orderId={order.id} t={t} locale={locale} />
        </div>
      </div>

      {!showExecutionPlan && (
        <OrderApprovalActions
          orderId={order.id}
          orderCode={order.code}
          t={t}
          onApproved={handleApproved}
          onDecisionDone={() => setNavigateHome(true)}
        />
      )}
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
