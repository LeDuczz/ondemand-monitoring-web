import { useCallback, useState } from 'react'

import {
  ErrorState,
  LoadingState,
} from '../../../../shared/components/odm/StateView'
import { useI18n } from '../../../../shared/i18n'
import { ContextAwareHelpWidget } from '../../../support/components/ContextAwareHelpWidget'
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
} from '../../../finance/CustomerFinancePanel'
import { CustomerDeliveryPanel } from '../../../delivery/CustomerDeliveryPanel'

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
  const updateFinance = useCallback((state: CustomerFinanceState) => {
    setFinance(state)
  }, [])

  if (detail.loading && !order) return <LoadingState />
  if (!order || detail.error) {
    return (
      <ErrorState
        title={t.errorTitle}
        error={undefined}
        onRetry={detail.reload}
      />
    )
  }

  return (
    <div className="od-page">
      <OrderHeader order={order} />
      <ReviewNotice order={order} onInformationSubmitted={detail.reload} />
      <OrderActions order={order} />
      <OrderOverviewVisualCard order={order} />
      <CustomerOrderMissionsSection key={order.id} orderId={order.id} />
      <div className="od-grid">
        <div className="od-stack">
          <OrderInfoCard
            order={order}
            canEdit={
              ['PENDING', 'NEEDS_INFO'].includes(order.status) ||
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
        <div className="od-stack">
          <CustomerFinancePanel orderId={order.id} onStateChange={updateFinance} />
          {['IN_PROGRESS', 'COMPLETED'].includes(order.status) ? (
            <CustomerDeliveryPanel orderId={order.id} />
          ) : null}
          <OrderTimeline status={order.status} events={order.timeline} finance={finance} />
          <ContextAwareHelpWidget
            type="ORDER"
            id={order.code}
            status={order.status}
            statusLabel={getOrderStatusMeta(order.status, lang).label}
            orderId={order.id}
          />
        </div>
      </div>
    </div>
  )
}
