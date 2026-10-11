import { useI18n } from '../../../../../shared/i18n'
import { ordersPagerMessages } from './OrdersPager.messages'

type Props = {
  page: number
  totalPages: number
  totalItems: number
  onPage: (page: number) => void
}

export function OrdersPager({ page, totalPages, totalItems, onPage }: Props) {
  const { t } = useI18n(ordersPagerMessages)
  const total = <span>{t.total(totalItems)}</span>
  if (totalPages <= 1) return <div className="ord-pager">{total}</div>
  return (
    <div className="ord-pager">
      {total}
      <div className="ord-pager-nav">
        <button
          type="button"
          className="odm-btn odm-btn-gh ord-btn is-sm"
          disabled={page <= 0}
          onClick={() => onPage(page - 1)}
        >
          {t.prev}
        </button>
        <span>{t.page(page + 1, totalPages)}</span>
        <button
          type="button"
          className="odm-btn odm-btn-gh ord-btn is-sm"
          disabled={page + 1 >= totalPages}
          onClick={() => onPage(page + 1)}
        >
          {t.next}
        </button>
      </div>
    </div>
  )
}
