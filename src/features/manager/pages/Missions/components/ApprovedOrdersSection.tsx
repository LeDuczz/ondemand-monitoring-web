import { managerHref } from '../../../routes'
import { formatOrderCode } from '../../../components/common/format'
import type { OrderCreateResponse } from '../../../types/orders'
import { useI18n } from '../../../../../shared/i18n'
import { approvedOrdersSectionMessages } from './ApprovedOrdersSection.messages'

export function ApprovedOrdersSection({
  showApprovedOrders,
  setupOrders,
}: {
  showApprovedOrders: boolean
  setupOrders: OrderCreateResponse[]
}) {
  const { t } = useI18n(approvedOrdersSectionMessages)
  return (
    <>
      {showApprovedOrders && setupOrders.length > 0 && (
        <section className="odm-card" aria-label={t.approvedOrders.title}>
          <h2>{t.approvedOrders.title}</h2>
          {setupOrders.map((order) => (
            <a
              key={order.id}
              className="odm-btn"
              href={managerHref({ screen: 'orderReview', orderId: order.id })}
            >
              {formatOrderCode(order.orderCode ?? order.id)} ·{' '}
              {t.approvedOrders.action}
            </a>
          ))}
        </section>
      )}
    </>
  )
}
