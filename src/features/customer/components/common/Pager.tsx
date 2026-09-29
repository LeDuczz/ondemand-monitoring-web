import { useI18n } from '../../../../shared/i18n'
import './Pager.css'
import { pagerMessages } from './Pager.messages'

type Props = {
  /** Zero-based current page. */
  page: number
  totalPages: number
  totalItems: number
  /** Noun for the total, e.g. "tệp" / "files". */
  unit: string
  onPage: (page: number) => void
}

/** Prev / next pager shared by the customer lists (zero-based pages). */
export function Pager({ page, totalPages, totalItems, unit, onPage }: Props) {
  const { t } = useI18n(pagerMessages)
  return (
    <div className="cm-pager">
      <span>{t.total(totalItems, unit)}</span>
      <div className="cm-pager-nav">
        <button
          type="button"
          className="odm-btn odm-btn-gh odm-btn-sm"
          disabled={page <= 0}
          onClick={() => onPage(page - 1)}
        >
          {t.prev}
        </button>
        <span>{t.page(totalPages === 0 ? 0 : page + 1, totalPages)}</span>
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
