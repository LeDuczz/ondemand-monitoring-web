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
  return (
    <div className="ord-pager">
      <span>{t.total(totalItems)}</span>
      <div className="ord-pager-nav">
        <button
          type="button"
          className="odm-btn odm-btn-gh odm-btn-sm"
          disabled={page <= 0}
          onClick={() => onPage(page - 1)}
        >
          {t.prev}
        </button>
        <span>{t.page(page + 1, totalPages)}</span>
        <button
          type="button"
          className="odm-btn odm-btn-gh odm-btn-sm"
          disabled={page + 1 >= totalPages}
          onClick={() => onPage(page + 1)}
        >
          {t.next}
        </button>
      </div>
    </div>
  )
}
