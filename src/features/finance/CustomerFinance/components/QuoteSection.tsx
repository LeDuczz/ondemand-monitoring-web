import { useI18n } from '../../../../shared/i18n'
import { formatVnd } from '../../../../shared/lib/formatVnd'
import { SummaryRow } from '../../components/common/SummaryRow'
import type { Invoice, Quote } from '../../types'
import { quoteSectionMessages } from './QuoteSection.messages'

export function QuoteSection({
  quote,
  invoice,
  busy,
  onAccept,
}: {
  quote: Quote
  invoice: Invoice | null
  busy: boolean
  onAccept: () => void
}) {
  const { t } = useI18n(quoteSectionMessages)

  return (
    <div className="customer-quote-body">
      <div className="customer-quote-items">
        {quote.items
          .filter((item) => item.type !== 'ADJUSTMENT')
          .map((item) => (
            <div key={item.id}>
              <span>
                <b>
                  {item.type === 'INCLUDED' ? '✓ ' : ''}
                  {item.description}
                </b>
                <small>
                  {item.type === 'ADDITIONAL'
                    ? t.additional
                    : item.type === 'PACKAGE'
                      ? t.package
                      : t.included}
                </small>
              </span>
              <strong>{formatVnd(item.amount)}</strong>
            </div>
          ))}
      </div>
      <dl className="finance-summary customer-summary">
        <SummaryRow label={t.packagePrice} value={quote.packagePrice} />
        <SummaryRow label={t.additionalCost} value={quote.additionalAmount} />
        <SummaryRow label={t.discount} value={-quote.discountAmount} />
        <SummaryRow label={t.adjustment} value={quote.adjustmentAmount} />
        <SummaryRow label={t.total} value={quote.totalAmount} total />
      </dl>
      {quote.managerNote ? (
        <p className="customer-manager-note">
          <b>{t.managerNote}</b> {quote.managerNote}
        </p>
      ) : null}
      {quote.status === 'APPROVED' && !invoice ? (
        <button
          className="odm-btn odm-btn-p"
          type="button"
          disabled={busy}
          onClick={onAccept}
        >
          {t.accept}
        </button>
      ) : null}
    </div>
  )
}
