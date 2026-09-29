import { EmptyState } from '../../../shared/components/odm/StateView'
import { ContextAwareHelpWidget } from '../../support/components/ContextAwareHelpWidget'
import { useI18n } from '../../../shared/i18n'
import { livePageMessages } from './LivePage.messages'
import { customerHref } from '../routes'

export function LivePage({ orderId }: { orderId: string }) {
  const { t } = useI18n(livePageMessages)
  return (
    <div>
      <div style={{ marginBottom: 16, fontSize: 13, color: 'var(--tx3)' }}>
        <a
          href={customerHref({ screen: 'orderDetail', orderId })}
          style={{ color: 'var(--tx3)', textDecoration: 'none' }}
        >
          {t.backToOrder}
        </a>
      </div>
      <EmptyState
        title={t.title}
        description={t.description}
      />
      <ContextAwareHelpWidget type="MISSION" id={orderId} status="IN_FLIGHT" orderId={orderId} />
    </div>
  )
}
