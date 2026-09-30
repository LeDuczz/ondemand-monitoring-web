import { useI18n } from '../../../../../shared/i18n'
import { auditPagerMessages } from './AuditPager.messages'

type Props = {
  /** 1-based page number. */
  page: number
  totalPages: number
  total: number
  onPage: (page: number) => void
}

export function AuditPager({ page, totalPages, total, onPage }: Props) {
  const { t } = useI18n(auditPagerMessages)
  return (
    <div className="adm-pager">
      <span className="adm-pager-page">
        {t.total}: {total}
      </span>
      <div className="adm-pager-nav">
        <button
          type="button"
          className="odm-btn odm-btn-gh odm-btn-sm"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        >
          {t.prev}
        </button>
        <span className="adm-pager-page">
          {page} / {Math.max(totalPages, 1)}
        </span>
        <button
          type="button"
          className="odm-btn odm-btn-gh odm-btn-sm"
          disabled={page >= totalPages}
          onClick={() => onPage(page + 1)}
        >
          {t.next}
        </button>
      </div>
    </div>
  )
}
