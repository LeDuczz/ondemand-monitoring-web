import {
  ErrorState,
  LoadingState,
} from '../../../../shared/components/odm/StateView'
import { useI18n } from '../../../../shared/i18n'
import { ContextAwareHelpWidget } from '../../../support/components/ContextAwareHelpWidget'
import { CancelOrderModal } from './components/CancelOrderModal'
import { DeliverablesCard } from './components/DeliverablesCard'
import { OrderActions } from './components/OrderActions'
import { OrderHeader } from './components/OrderHeader'
import { OrderInfoCard } from './components/OrderInfoCard'
import { OrderTimeline } from './components/OrderTimeline'
import { ReviewNotice } from './components/ReviewNotice'
import { useOrderDetail } from './hooks/useOrderDetail'
import { checklistMessages } from '../../lib/checklist/messages'
import { getOrderStatusMeta } from '../../lib/orderStatus'
import { CardTitle } from './components/CardTitle'
import { ChecklistSnapshotCard } from '../../components/checklist/ChecklistSnapshotCard'
import './OrderDetail.css'
import { orderDetailPageMessages } from './OrderDetailPage.messages'
import { CustomerFinancePanel } from '../../../finance/CustomerFinancePanel'

/** Customer order detail backed by `GET /api/orders/{id}`. */
export function OrderDetailPage({ orderId }: { orderId: string }) {
  const { t, lang } = useI18n(orderDetailPageMessages)
  const { t: checklistT } = useI18n(checklistMessages)
  const detail = useOrderDetail(orderId)
  const { order } = detail

  if (detail.loading && !order) return <LoadingState />
  if (!order) {
    return (
      <ErrorState
        title={t.errorTitle}
        error={detail.error}
        onRetry={detail.reload}
      />
    )
  }

  return (
    <div className="od-page">
      <OrderHeader order={order} />
      <ReviewNotice order={order} />
      <OrderActions order={order} onCancel={detail.openCancel} />
      <div className="od-grid">
        <div className="od-stack">
          <OrderInfoCard order={order} />
          <ChecklistSnapshotCard
            title={<CardTitle icon="drone">{checklistT.title}</CardTitle>}
            items={order.checklistItems}
            snapshotAt={order.checklistSnapshotAt}
          />
          <CustomerFinancePanel orderId={order.id} />
          <DeliverablesCard order={order} />
        </div>
        <div className="od-stack">
          <OrderTimeline status={order.status} events={order.timeline} />
          <ContextAwareHelpWidget
            type="ORDER"
            id={order.code}
            status={order.status}
            statusLabel={getOrderStatusMeta(order.status, lang).label}
            orderId={order.id}
          />
        </div>
      </div>
      {detail.confirmOpen && (
        <CancelOrderModal
          orderTitle={order.title}
          cancelling={detail.cancelling}
          error={detail.cancelError}
          onConfirm={() => void detail.cancel()}
          onClose={detail.closeCancel}
        />
      )}
    </div>
  )
}
