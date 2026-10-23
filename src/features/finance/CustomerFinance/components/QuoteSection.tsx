import { useI18n } from '../../../../shared/i18n'
import { customerFinancePanelMessages } from '../CustomerFinancePanel.messages'
import { QuoteLines } from './QuoteLines'
import { Summary } from './Summary'
import type { CustomerQuote, Invoice } from '../../types'

export function QuoteSection({
  quote,
  legalReady,
  legalStatus,
  invoice,
  busy,
  accept,
}: {
  quote: CustomerQuote
  legalReady: boolean
  legalStatus:
    | 'NOT_REVIEWED'
    | 'NOT_REQUIRED'
    | 'PENDING_PERMIT'
    | 'APPROVED'
    | 'REJECTED'
    | undefined
  invoice: Invoice | null
  busy: boolean
  accept: () => Promise<void>
}) {
  const { t } = useI18n(customerFinancePanelMessages)
  return (
    <div className="customer-quote-body">
      <QuoteLines items={quote.items} />
      <dl className="finance-summary customer-summary">
        <Summary label={t.estimatedCost} value={quote.estimatedBaseAmount} />
        <Summary
          label={t.additionalServices}
          value={quote.approvedAdditionalServiceAmount}
        />
        <Summary label={t.orderTotal} value={quote.finalOrderAmount} total />
      </dl>
      <p className="co-estimate-notice">
        {t.estimateNotice}
      </p>
      {!legalReady ? (
        <div className="customer-deposit-notice">
          <b>
            {legalStatus === 'REJECTED'
              ? t.legalRejectedTitle
              : t.legalPendingTitle}
          </b>
          <span>
            {legalStatus === 'REJECTED'
              ? t.legalRejectedBody
              : t.legalPendingBody}
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
          onClick={() => void accept()}
        >
          {t.acceptQuote}
        </button>
      ) : null}
    </div>
  )
}
