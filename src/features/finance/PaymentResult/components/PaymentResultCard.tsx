import { useI18n } from '../../../../shared/i18n'
import { formatVnd } from '../../../../shared/lib/formatVnd'
import { FinanceAlert } from '../../components/common/FinanceAlert'
import type { Payment } from '../../types'
import { paymentResultCardMessages } from './PaymentResultCard.messages'

export function PaymentResultCard({
  payment,
  cancelled,
  checking,
  error,
  onRefresh,
  onRetry,
}: {
  payment: Payment | null
  cancelled: boolean
  checking: boolean
  error: string | null
  onRefresh: () => void
  onRetry: () => void
}) {
  const { t } = useI18n(paymentResultCardMessages)
  const success = payment?.status === 'SUCCESS'

  return (
    <section className="payment-result-card" aria-live="polite">
      <div
        className={`payment-result-icon ${success ? 'is-success' : cancelled ? 'is-cancelled' : ''}`}
        aria-hidden="true"
      >
        {success ? '✓' : cancelled ? '×' : '…'}
      </div>
      <h1>
        {success
          ? t.titleSuccess
          : cancelled
            ? t.titleCancelled
            : checking
              ? t.titleChecking
              : t.titlePending}
      </h1>
      <p>
        {success
          ? payment?.type === 'DEPOSIT'
            ? t.bodyDeposit
            : t.bodyFinal
          : cancelled
            ? t.bodyCancelled
            : t.bodyPending}
      </p>
      {payment ? (
        <dl className="payment-result-detail">
          <div>
            <dt>{t.reference}</dt>
            <dd>{payment.transactionReference}</dd>
          </div>
          <div>
            <dt>{t.amount}</dt>
            <dd>{formatVnd(payment.amount)}</dd>
          </div>
        </dl>
      ) : null}
      {error ? <FinanceAlert tone="error">{error}</FinanceAlert> : null}
      <div className="payment-result-actions">
        {!success && !checking ? (
          <button
            className="odm-btn odm-btn-p"
            type="button"
            onClick={onRefresh}
          >
            {t.refresh}
          </button>
        ) : null}
        {cancelled && payment && !success ? (
          <button className="odm-btn" type="button" onClick={onRetry}>
            {t.retry}
          </button>
        ) : null}
        <a className="odm-btn" href="#portal/customer/orders">
          {t.backToOrders}
        </a>
      </div>
    </section>
  )
}
