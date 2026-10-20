import { useI18n } from '../../../../shared/i18n'
import { formatVnd } from '../../../../shared/lib/formatVnd'
import { pricingDescription } from '../../../../shared/lib/pricingPresentation'
import { SummaryRow } from '../../components/common/SummaryRow'
import type {
  CustomerQuote,
  Invoice,
  LegalReviewStatus,
} from '../../types'
import { quoteSectionMessages } from './QuoteSection.messages'

type Items = CustomerQuote['items']

export function QuoteSection({
  quote,
  invoice,
  legalStatus,
  legalReady,
  busy,
  onAccept,
}: {
  quote: CustomerQuote
  invoice: Invoice | null
  legalStatus?: LegalReviewStatus | null
  legalReady: boolean
  busy: boolean
  onAccept: () => void
}) {
  const { t } = useI18n(quoteSectionMessages)

  return (
    <div className="customer-quote-body">
      <QuoteLines items={quote.items} />
      <dl className="finance-summary customer-summary">
        <SummaryRow label={t.estimatedCost} value={quote.estimatedBaseAmount} />
        <SummaryRow
          label={t.additionalServices}
          value={quote.approvedAdditionalServiceAmount}
        />
        <SummaryRow label={t.orderTotal} value={quote.finalOrderAmount} total />
      </dl>
      <p className="co-estimate-notice">{t.estimateNotice}</p>
      {!legalReady ? (
        <div className="customer-deposit-notice">
          <b>
            {legalStatus === 'REJECTED' ? t.rejectedTitle : t.verifyingTitle}
          </b>
          <span>
            {legalStatus === 'REJECTED' ? t.rejectedBody : t.verifyingBody}
          </span>
        </div>
      ) : legalStatus === 'PENDING_PERMIT' ? (
        <div className="customer-deposit-notice">
          <b>{t.permitTitle}</b>
          <span>{t.permitBody}</span>
        </div>
      ) : null}
      {quote.status === 'APPROVED' && !invoice && legalReady ? (
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

/** Quote lines grouped per checklist (heading + subtotal), then the order-level lines. */
function QuoteLines({ items }: { items: Items }) {
  const { t } = useI18n(quoteSectionMessages)
  const lines = items.filter((item) => item.type !== 'ADJUSTMENT')
  const groups = new Map<string, Items>()
  const orderLevel: Items = []
  for (const line of lines) {
    if (!line.orderChecklistItemId) {
      orderLevel.push(line)
      continue
    }
    groups.set(line.orderChecklistItemId, [
      ...(groups.get(line.orderChecklistItemId) ?? []),
      line,
    ])
  }
  const sum = (rows: Items) => rows.reduce((total, row) => total + row.amount, 0)
  const lineText = (row: Items[number], checklistName?: string) => {
    if (row.type === 'MANAGER_ADJUSTMENT') {
      const reason = row.description.split(' · ').slice(1).join(' · ')
      return reason ? `${t.approvedAdjustment}: ${reason}` : t.approvedAdjustment
    }
    const text = pricingDescription(row.description)
    const prefix = checklistName ? `${checklistName} · ` : ''
    return prefix && text.startsWith(prefix) ? text.slice(prefix.length) : text
  }
  return (
    <div className="customer-quote-groups">
      {[...groups.entries()].map(([id, rows]) => {
        const name =
          pricingDescription(rows[0].description).split(' · ')[0] || t.content
        return (
          <section key={id} className="customer-quote-group">
            <header>
              <strong title={name}>{name}</strong>
              <b>{formatVnd(sum(rows))}</b>
            </header>
            <ul>
              {rows.map((row) => (
                <li key={row.id}>
                  <span>{lineText(row, name)}</span>
                  <span>{formatVnd(row.amount)}</span>
                </li>
              ))}
            </ul>
          </section>
        )
      })}
      {orderLevel.length > 0 && (
        <section className="customer-quote-group">
          <header>
            <strong>{t.orderLevel}</strong>
            <b>{formatVnd(sum(orderLevel))}</b>
          </header>
          <ul>
            {orderLevel.map((row) => (
              <li key={row.id}>
                <span>{lineText(row)}</span>
                <span>{formatVnd(row.amount)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
