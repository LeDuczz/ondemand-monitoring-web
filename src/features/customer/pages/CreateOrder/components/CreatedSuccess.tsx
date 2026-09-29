import { Icon } from '../../../../../shared/components/Icon'
import { useI18n } from '../../../../../shared/i18n'
import { customerHref } from '../../../routes'
import { createdSuccessMessages } from './CreatedSuccess.messages'

export function CreatedSuccess({ orderId }: { orderId: string }) {
  const { t } = useI18n(createdSuccessMessages)
  return (
    <div className="co-success">
      <div className="co-success-icon" aria-hidden="true">
        <Icon name="check" width={28} height={28} />
      </div>
      <h2>{t.title}</h2>
      <p className="co-hint">{t.description}</p>
      <p className="co-hint">
        {t.orderCode}: <span className="co-mono">{orderId}</span>
      </p>
      <a href={customerHref({ screen: 'orders' })} className="odm-btn odm-btn-p">
        {t.viewMyOrders}
      </a>
    </div>
  )
}
