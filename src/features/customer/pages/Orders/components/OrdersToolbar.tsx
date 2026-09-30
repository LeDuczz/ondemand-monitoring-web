import { useLanguage, useI18n } from '../../../../../shared/i18n'
import type { OrderStatus } from '../../../../../shared/types/domain'
import { getOrderStatusMeta } from '../../../lib/orderStatus'
import { ordersToolbarMessages } from './OrdersToolbar.messages'

/** Statuses the BE `GET /api/orders/mine?status=` accepts. */
export const ORDER_FILTERS: readonly OrderStatus[] = [
  'PENDING',
  'APPROVED',
  'IN_PROGRESS',
  'COMPLETED',
  'REJECTED',
  'CANCELLED',
]

type Props = {
  status: OrderStatus | ''
  query: string
  onStatus: (status: OrderStatus | '') => void
  onQuery: (query: string) => void
}

/** Status chips (server-side filter) and a client-side search box. */
export function OrdersToolbar({ status, query, onStatus, onQuery }: Props) {
  const { t } = useI18n(ordersToolbarMessages)
  const { lang } = useLanguage()
  const chips: Array<{ value: OrderStatus | ''; label: string }> = [
    { value: '', label: t.all },
    ...ORDER_FILTERS.map((value) => ({
      value,
      label: getOrderStatusMeta(value, lang).label,
    })),
  ]

  return (
    <div className="ord-toolbar">
      <div className="ord-chips" role="group" aria-label={t.filterLabel}>
        {chips.map((chip) => (
          <button
            key={chip.value || 'all'}
            type="button"
            className={`ord-chip${status === chip.value ? ' is-active' : ''}`}
            aria-pressed={status === chip.value}
            onClick={() => onStatus(chip.value)}
          >
            {chip.label}
          </button>
        ))}
      </div>
      <input
        type="search"
        className="ord-search"
        value={query}
        aria-label={t.searchLabel}
        placeholder={t.searchPlaceholder}
        onChange={(e) => onQuery(e.target.value)}
      />
    </div>
  )
}
