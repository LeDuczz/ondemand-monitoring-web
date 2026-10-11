import { Icon } from '../../../../../shared/components/Icon'
import { EmptyState } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import { customerHref } from '../../../routes'
import { ordersEmptyMessages } from './OrdersEmpty.messages'

type Props = { filtered: boolean; onClear: () => void }

export function OrdersEmpty({ filtered, onClear }: Props) {
  const { t } = useI18n(ordersEmptyMessages)
  return (
    <EmptyState
      title={filtered ? t.noMatchTitle : t.emptyTitle}
      description={filtered ? t.emptyFiltered : t.emptyAll}
      action={
        filtered ? (
          <button type="button" className="odm-btn ord-btn is-outline" onClick={onClear}>
            {t.clearFilters}
          </button>
        ) : (
          <a className="odm-btn odm-btn-p ord-btn" href={customerHref({ screen: 'createOrder' })}>
            <Icon name="plus" width={16} height={16} aria-hidden="true" />
            {t.createFirst}
          </a>
        )
      }
    />
  )
}
