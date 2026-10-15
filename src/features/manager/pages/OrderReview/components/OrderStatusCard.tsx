import type { OrderDetail } from '../../../types/orders'
import { formatVn } from '../../../components/common/format'
import { Card } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import { orderStatusCardMessages } from './OrderStatusCard.messages'

export function OrderStatusCard({
  order,
  locale,
}: {
  order: OrderDetail
  locale: 'vi-VN' | 'en-US'
}) {
  const { t } = useI18n(orderStatusCardMessages)

  return (
    <Card title={t.orderStatus}>
      <dl className="odm-or-kv">
        <div>
          <dt>{t.createdAt}</dt>
          <dd>
            {order.submittedAt ? formatVn(order.submittedAt, locale) : '—'}
          </dd>
        </div>
      </dl>
    </Card>
  )
}
