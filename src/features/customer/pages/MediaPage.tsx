import { EmptyState } from '../../../shared/components/odm/StateView'
import { useI18n } from '../../../shared/i18n'
import { backToOrderMessages } from '../i18n/backToOrder'
import { customerHref } from '../routes'
import { mediaPageMessages } from './MediaPage.messages'

export function MediaPage({ orderId }: { orderId: string }) {
  const { t: tBack } = useI18n(backToOrderMessages)
  const { t } = useI18n(mediaPageMessages)
  return (
    <div>
      <div style={{ marginBottom: 16, fontSize: 13, color: 'var(--tx3)' }}>
        <a
          href={customerHref({ screen: 'orderDetail', orderId })}
          style={{ color: 'var(--tx3)', textDecoration: 'none' }}
        >
          {tBack.backToOrder}
        </a>
      </div>
      <EmptyState title={t.title} description={t.description} />
    </div>
  )
}
