import { useCallback, useState } from 'react'

import {
  ErrorState,
  LoadingState,
} from '../../../../shared/components/odm/StateView'
import { useI18n } from '../../../../shared/i18n'
import { ContextAwareHelpWidget } from '../../../support/components/ContextAwareHelpWidget'
import { customerHref } from '../../routes'
import { OrderActions } from './components/OrderActions'
import { OrderHeader } from './components/OrderHeader'
import { OrderInfoCard } from './components/OrderInfoCard'
import { OrderOverviewVisualCard } from './components/OrderOverviewVisualCard'
import { OrderTimeline } from './components/OrderTimeline'
import { ReviewNotice } from './components/ReviewNotice'
import { useOrderDetail } from './hooks/useOrderDetail'
import { checklistMessages } from '../../lib/checklist/messages'
import { getOrderStatusMeta } from '../../lib/orderStatus'
import { CardTitle } from './components/CardTitle'
import { ChecklistSnapshotCard } from '../../components/checklist/ChecklistSnapshotCard'
import { CustomerOrderMissionsSection } from '../../components/reports/CustomerOrderMissionsSection'
import './OrderDetail.css'
import { orderDetailPageMessages } from './OrderDetailPage.messages'
import {
  CustomerFinancePanel,
  type CustomerFinanceState,
} from '../../../finance/CustomerFinance'
import { CustomerDeliveryPanel } from '../../../delivery/CustomerDeliveryPanel'
import type { CustomerMissionSummary } from '../../api/customerMissionReportApi'

/** Customer order detail backed by `GET /api/orders/{id}`. */
export function OrderDetailPage({ orderId }: { orderId: string }) {
  const { t, lang } = useI18n(orderDetailPageMessages)
  const { t: checklistT } = useI18n(checklistMessages)
  const detail = useOrderDetail(orderId)
  const { order } = detail
  const [finance, setFinance] = useState<CustomerFinanceState>({
    quote: null,
    invoice: null,
    loading: true,
  })
  const [tab, setTab] = useState<'overview' | 'results'>('overview')
  const [missions, setMissions] = useState<CustomerMissionSummary[]>([])
  const updateFinance = useCallback((state: CustomerFinanceState) => {
    setFinance(state)
  }, [])

  const goToFinance = useCallback(() => {
    setTab('overview')
    window.requestAnimationFrame(() => {
      const target = document.getElementById('od-finance')
      if (!target) return
      const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
      target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
      target.querySelector<HTMLElement>('button.odm-btn-p:not(:disabled)')?.focus({ preventScroll: true })
    })
  }, [])

  if (detail.loading && !order) {
    return (
      <div className="od-page">
        <LoadingState />
      </div>
    )
  }
  if (!order || detail.error) {
    return (
      <div className="od-page">
        <div className="ui-page-back od-state-back">
          <a href={customerHref({ screen: 'orders' })}>{t.backToOrders}</a>
        </div>
        <ErrorState
          title={t.errorTitle}
          error={undefined}
          onRetry={detail.reload}
        />
      </div>
    )
  }

  const hasResults = ['IN_PROGRESS', 'COMPLETED'].includes(order.status)
  const activeTab = hasResults ? tab : 'overview'

  return (
    <div className="od-page">
      <OrderHeader
        order={order}
        actions={<OrderActions order={order} finance={finance} onNextAction={goToFinance} />}
      />
      <ReviewNotice order={order} onInformationSubmitted={detail.reload} />
      <div className="od-layout">
        <div className="od-main">
          <OrderOverviewVisualCard order={order} />
          {hasResults ? (
            <div className="od-tabs" role="tablist">
              {(['overview', 'results'] as const).map((key) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === key}
                  className={`od-tab${activeTab === key ? ' is-active' : ''}`}
                  onClick={() => setTab(key)}
                >
                  {key === 'overview' ? t.tabOverview : t.tabResults}
                </button>
              ))}
            </div>
          ) : null}
          {activeTab === 'results' ? <CustomerDeliveryPanel orderId={order.id} /> : null}
          <div className="od-stack od-main-overview" hidden={activeTab !== 'overview'}>
            <div id="od-finance" className="od-anchor">
              <CustomerFinancePanel
                orderId={order.id}
                legalStatus={order.legalReviewStatus}
                onStateChange={updateFinance}
              />
            </div>
            <CustomerOrderMissionsSection key={order.id} orderId={order.id} onMissionsChange={setMissions} />
            <OrderInfoCard
              order={order}
              canEdit={
                (['PENDING', 'NEEDS_INFO'].includes(order.status) &&
                  !(order.status === 'NEEDS_INFO' && order.requestedUpdateScope)) ||
                (order.status === 'APPROVED' && finance.quote?.status !== 'ACCEPTED_BY_CUSTOMER' && !finance.invoice)
              }
              onUpdated={detail.reload}
            />
            <ChecklistSnapshotCard
              title={<CardTitle icon="drone">{checklistT.title}</CardTitle>}
              items={order.checklistItems}
              snapshotAt={order.checklistSnapshotAt}
            />
          </div>
        </div>
        <aside className="od-side">
          <div className="od-side-status">
            <OrderTimeline status={order.status} events={order.timeline} finance={finance} missions={missions} />
          </div>
          <div className="od-side-help">
            <ContextAwareHelpWidget
              type="ORDER"
              id={order.code}
              status={order.status}
              statusLabel={getOrderStatusMeta(order.status, lang).label}
              orderId={order.id}
            />
          </div>
        </aside>
      </div>
    </div>
  )
}
