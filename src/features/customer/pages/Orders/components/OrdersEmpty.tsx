import { EmptyState } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import { customerHref } from '../../../routes'
import { ordersEmptyMessages } from './OrdersEmpty.messages'

type Props = { filtered: boolean; onClear: () => void }

export function OrdersEmpty({ filtered, onClear }: Props) {
  const { t } = useI18n(ordersEmptyMessages)
  return (
    <EmptyState
      title={t.emptyTitle}
      description={filtered ? t.emptyFiltered : t.emptyAll}
      action={
        filtered ? (
          <button type="button" className="odm-btn odm-btn-gh" onClick={onClear}>
            {t.clearFilters}
          </button>
        ) : (
          <a className="odm-btn odm-btn-p" href={customerHref({ screen: 'createOrder' })}>
            {t.createFirst}
          </a>
        )
      }
    />
  )
}
