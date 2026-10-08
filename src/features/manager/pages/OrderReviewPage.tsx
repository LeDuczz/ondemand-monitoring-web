import { useState } from 'react'

import { ApiError } from '../../../shared/api/httpClient'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../shared/i18n'
import { ordersApi } from '../api/ordersApi'
import { InternalNoteCard } from '../components/orderReview/InternalNoteCard'
import { OrderApprovalActions } from '../components/orderReview/OrderApprovalActions'
import { OrderAttachmentsCard } from '../components/orderReview/OrderAttachmentsCard'
import { OrderCustomerCard } from '../components/orderReview/OrderCustomerCard'
import { OrderCustomerRequestDetails } from '../components/orderReview/OrderCustomerRequestDetails'
import { OrderLocationCard } from '../components/orderReview/OrderLocationCard'
import { OrderServiceInfo } from '../components/orderReview/OrderServiceInfo'
import { OrderChecklistCard } from '../components/orderReview/OrderChecklistCard'
import { OrderStatusCard } from '../components/orderReview/OrderStatusCard'
import { ResourceAvailabilityCard } from '../components/orderReview/ResourceAvailabilityCard'
import { OrderWorkflowStepper } from '../components/OrderWorkflowStepper'
import { managerHref } from '../routes'
import { CreateMissionPage } from './CreateMissionPage'
import {
  orderReviewPageMessages,
  type OrderReviewMessages,
} from './OrderReviewPage.messages'
import type { OrderDetail, OrderMissionBrief } from '../types/orders'
import { ManagerPricingPanel } from '../../finance/ManagerPricingPanel'
import { ManagerDeliveryPanel } from '../../delivery/ManagerDeliveryPanel'
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
  const [scheduleBrief, setScheduleBrief] = useState<OrderMissionBrief | null>(
    null,
  )

  if (navigateHome) {
    window.location.hash = managerHref({ screen: 'orderQueue' })
    return null
  }

  if (scheduleBrief) {
    return (
      <CreateMissionPage
        orderId={scheduleBrief.id}
        initialBrief={scheduleBrief}
      />
    )
  }

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
            <div
              className="odm-mono"
              style={{
                fontSize: 11.5,
                color: 'var(--tx3)',
                background: 'var(--sf3)',
                padding: '3px 8px',
                borderRadius: 5,
              }}
            >
              {orderQuery.error instanceof ApiError
                ? `${orderQuery.error.method} ${orderQuery.error.path}${
                    orderQuery.error.status
                      ? ` · ${orderQuery.error.status}`
                      : ''
                  }${orderQuery.error.code ? ` ${orderQuery.error.code}` : ''}`
                : t.debugFallback}
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

  const handleApproved = (
    result: Awaited<ReturnType<typeof ordersApi.approve>>,
  ) => {
    // Approve → straight into step 2 (schedule/setup), never back to the list.
    const missionId = getApprovedMissionId(result, order.id)
    if (missionId) {
      window.location.hash = managerHref({
        screen: 'missionSetup',
        missionId,
      })
      return
    }

    setScheduleBrief(toMissionBrief(order))
  }

  return (
    <div className="odm-or odm-or-review-page">
      <div className="odm-or-review-top">
        <div className="odm-or-pagehead">
          <h1 className="odm-or-title">{t.pageTitle}</h1>
          <p className="odm-or-subtitle">{t.pageSubtitle}</p>
        </div>
        <OrderWorkflowStepper currentStep={1} />
      </div>

      {/* Each section owns its own grid so a tall card in one section can
          never create blank rows in another. */}
      <section className="odm-or-grid odm-or-review-summary">
        <div className="odm-or-col">
          <OrderServiceInfo order={order} t={t} />
        </div>
        <div className="odm-or-col">
          <OrderStatusCard order={order} t={t} locale={locale} />
          <OrderCustomerCard order={order} t={t} />
        </div>
      </section>

      <section className="odm-or-review-section">
        <OrderCustomerRequestDetails order={order} t={t} />
      </section>

      <section className="odm-or-review-section">
        <ManagerPricingPanel
          orderId={order.id}
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

      <section className="odm-or-review-section">
        <ManagerDeliveryPanel orderId={order.id} />
      </section>

      <section className="odm-or-grid odm-or-review-more">
        <div className="odm-or-col odm-or-operational-left">
          <OrderChecklistCard order={order} t={t} />
          <OrderAttachmentsCard order={order} t={t} />
          <InternalNoteCard orderId={order.id} t={t} locale={locale} />
        </div>
        <div className="odm-or-col odm-or-operational-right">
          <OrderLocationCard order={order} t={t} />
          <ResourceAvailabilityCard query={previewQuery} t={t} />
        </div>
      </section>
    </div>
  )
}

function getApprovedMissionId(
  result: Awaited<ReturnType<typeof ordersApi.approve>>,
  orderId: string,
): string | null {
  if (!result || typeof result !== 'object') return null

  const record = result as Record<string, unknown>
  if (typeof record.missionId === 'string' && record.missionId.trim()) {
    return record.missionId
  }

  const mission = record.mission
  if (mission && typeof mission === 'object') {
    const missionRecord = mission as Record<string, unknown>
    if (typeof missionRecord.id === 'string' && missionRecord.id.trim()) {
      return missionRecord.id
    }
  }

  if (
    typeof record.id === 'string' &&
    record.id.trim() &&
    record.id !== orderId &&
    !('orderStatus' in record)
  ) {
    return record.id
  }

  return null
}

function toMissionBrief(order: OrderDetail): OrderMissionBrief {
  return {
    id: order.id,
    code: order.code,
    serviceName: order.serviceName,
    customerFullName: order.customer.fullName,
    preferredDate: order.preferredDate,
    preferredTimeName: order.preferredTimeName,
    addressText: order.addressText,
    center: order.center,
    radiusM: order.radiusM,
    nearestBase: order.nearestBase,
    mediaRequirements: order.mediaRequirements,
  }
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
