import { OrderIcon } from '../../../../manager/components/common/OrderIcon'
import { useI18n } from '../../../../../shared/i18n'
import type { CustomerFinanceState } from '../../../../finance/CustomerFinance'
import type { OrderDetailView } from '../../../lib/orders/types'
import { customerHref } from '../../../routes'
import { orderActionsMessages } from './OrderActions.messages'

export type OrderNextAction = 'acceptQuote' | 'payDeposit' | 'payFinal'

/** Mirrors the buttons the finance panel shows, so the header points at the same step. */
export function getNextAction(
  order: Pick<OrderDetailView, 'legalReviewStatus'>,
  finance: CustomerFinanceState,
): OrderNextAction | null {
  const legal = order.legalReviewStatus
  const legalReady =
    legal == null || legal === 'NOT_REQUIRED' || legal === 'APPROVED' || legal === 'PENDING_PERMIT'
  if (!legalReady) return null
  const { quote, invoice } = finance
  if (invoice) {
    if (invoice.paidAmount < invoice.depositAmount) return 'payDeposit'
    if (invoice.finalPaymentAllowed && invoice.remainingAmount > 0) return 'payFinal'
    return null
  }
  return quote?.status === 'APPROVED' ? 'acceptQuote' : null
}

/**
 * Header actions: at most one primary (the next payment/quote step, otherwise the
 * results link); anything else is ghost. The primary only scrolls to the finance
 * panel, where the real accept/pay buttons keep their behaviour.
 */
export function OrderActions({
  order,
  finance,
  onNextAction,
}: {
  order: OrderDetailView
  finance: CustomerFinanceState
  onNextAction: () => void
}) {
  const { t } = useI18n(orderActionsMessages)
  const hasMedia = order.status === 'IN_PROGRESS' || order.status === 'COMPLETED'
  const next = getNextAction(order, finance)

  return (
    <>
      {next && (
        <button type="button" className="odm-btn odm-btn-p od-btn" onClick={onNextAction}>
          {t[next]}
        </button>
      )}
      {hasMedia && (
        <a
          className={`odm-btn od-btn ${next ? 'odm-btn-gh' : 'odm-btn-p'}`}
          href={customerHref({ screen: 'media', orderId: order.id })}
        >
          <OrderIcon name="media" size={16} />
          {t.media}
        </a>
      )}
    </>
  )
}
