import { OrderServiceInfo } from '../../../components/common/OrderServiceInfo'
import { OrderCustomerRequestDetails } from '../../../components/common/OrderCustomerRequestDetails'
import { OrderCustomerCard } from '../../../components/common/OrderCustomerCard'
import { OrderChecklistCard } from './OrderChecklistCard'
import { OrderAttachmentsCard } from '../../../components/common/OrderAttachmentsCard'
import type { DetailData } from '../../../components/common/missionDetailHelpers'
import { useI18n } from '../../../../../shared/i18n'
import { orderTabMessages } from './OrderTab.messages'

export function OrderTab({ detail }: { detail: DetailData }) {
  const { t } = useI18n(orderTabMessages)
  return detail.order ? (
    <div className="odm-or-order-review-stack">
      <OrderServiceInfo order={detail.order} />
      <OrderCustomerRequestDetails order={detail.order} />
      <OrderCustomerCard order={detail.order} />
      <OrderChecklistCard order={detail.order} />
      <OrderAttachmentsCard order={detail.order} />
    </div>
  ) : (
    <section className="odm-or-card">
      <div className="odm-or-card-body odm-or-empty">{t.loadError}</div>
    </section>
  )
}
