import { useI18n } from '../../../../shared/i18n'
import { formatVnd } from '../../../../shared/lib/formatVnd'
import type { Invoice } from '../../types'
import { invoiceSectionMessages } from './InvoiceSection.messages'

export function InvoiceSection({
  invoice,
  busy,
  onPay,
}: {
  invoice: Invoice
  busy: boolean
  onPay: (kind: 'deposit' | 'final') => void
}) {
  const { t } = useI18n(invoiceSectionMessages)

  return (
    <div className="customer-invoice">
      <div className="customer-invoice-title">
        <div>
          <h3>{t.invoice(invoice.invoiceNumber)}</h3>
          <p>{t.depositInfo}</p>
        </div>
        <span className={`finance-status is-${invoice.status.toLowerCase()}`}>
          {t.status[invoice.status]}
        </span>
      </div>
      <div className="customer-payment-stats">
        <PaymentStat label={t.total} value={invoice.totalAmount} />
        <PaymentStat label={t.deposit} value={invoice.depositAmount} />
        <PaymentStat label={t.paid} value={invoice.paidAmount} />
        <PaymentStat label={t.remaining} value={invoice.remainingAmount} />
      </div>
      {invoice.paidAmount < invoice.depositAmount ? (
        <div className="customer-deposit-notice">
          <b>{t.awaitingDeposit}</b>
          <span>{t.awaitingDepositBody}</span>
        </div>
      ) : invoice.status !== 'PAID' ? (
        <div className="customer-deposit-notice is-ready">
          <b>{t.depositReceived}</b>
          <span>{t.depositReceivedBody}</span>
        </div>
      ) : null}
      <div className="finance-actions customer-payment-actions">
        {invoice.paidAmount < invoice.depositAmount ? (
          <button
            className="odm-btn odm-btn-p"
            type="button"
            disabled={busy}
            onClick={() => onPay('deposit')}
          >
            {t.payDeposit}
          </button>
        ) : null}
        {invoice.finalPaymentAllowed &&
        invoice.paidAmount >= invoice.depositAmount &&
        invoice.remainingAmount > 0 ? (
          <button
            className="odm-btn odm-btn-p"
            type="button"
            disabled={busy}
            onClick={() => onPay('final')}
          >
            {t.payRemaining}
          </button>
        ) : null}
      </div>
    </div>
  )
}

function PaymentStat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{formatVnd(value)}</strong>
    </div>
  )
}
