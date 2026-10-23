import { useI18n } from '../../../../shared/i18n'
import { pricingLabel } from '../../../../shared/lib/pricingPresentation'
import { customerFinancePanelMessages } from '../CustomerFinancePanel.messages'
import { PaymentStat } from './PaymentStat'
import type { Invoice } from '../../types'

export function InvoiceSection({
  invoice,
  legalReady,
  busy,
  pay,
  completeTestDeposit,
  testPaymentLabel,
}: {
  invoice: Invoice
  legalReady: boolean
  busy: boolean
  pay: (type: 'deposit' | 'final') => Promise<void>
  completeTestDeposit: () => Promise<void>
  testPaymentLabel: string
}) {
  const { t, lang } = useI18n(customerFinancePanelMessages)
  return (
    <div className="customer-invoice">
      <div className="customer-invoice-title">
        <div>
          <h3>{t.invoiceTitle(invoice.invoiceNumber)}</h3>
          <p>{t.invoiceHint}</p>
        </div>
        <span className={`finance-status is-${invoice.status.toLowerCase()}`}>
          {t.invoiceStatus[invoice.status] ??
            (lang === 'vi'
              ? pricingLabel(invoice.status)
              : invoice.status.replaceAll('_', ' ').toLowerCase())}
        </span>
      </div>
      <div className="customer-payment-stats">
        <PaymentStat label={t.statTotal} value={invoice.totalAmount} />
        <PaymentStat label={t.statDeposit} value={invoice.depositAmount} />
        <PaymentStat label={t.statPaid} value={invoice.paidAmount} />
        <PaymentStat label={t.statRemaining} value={invoice.remainingAmount} />
      </div>
      {invoice.paidAmount < invoice.depositAmount ? (
        <div className="customer-deposit-notice">
          <b>{t.depositWaitingTitle}</b>
          <span>{t.depositWaitingBody}</span>
        </div>
      ) : invoice.status !== 'PAID' ? (
        <div className="customer-deposit-notice is-ready">
          <b>{t.depositReceivedTitle}</b>
          <span>{t.depositReceivedBody}</span>
        </div>
      ) : null}
      <div className="finance-actions customer-payment-actions">
        {invoice.paidAmount < invoice.depositAmount && legalReady ? (
          <>
            <button
              className="odm-btn odm-btn-p"
              type="button"
              disabled={busy}
              onClick={() => void pay('deposit')}
            >
              {t.payDeposit}
            </button>
            {import.meta.env.DEV ? (
              <button
                className="odm-btn"
                type="button"
                disabled={busy}
                onClick={() => void completeTestDeposit()}
              >
                {testPaymentLabel}
              </button>
            ) : null}
          </>
        ) : null}
        {invoice.finalPaymentAllowed &&
        invoice.paidAmount >= invoice.depositAmount &&
        invoice.remainingAmount > 0 ? (
          <button
            className="odm-btn odm-btn-p"
            type="button"
            disabled={busy}
            onClick={() => void pay('final')}
          >
            {t.payRemaining}
          </button>
        ) : null}
      </div>
    </div>
  )
}
