import { useCallback, useEffect, useState } from 'react'

import { ApiError } from '../../shared/api/httpClient'
import { useI18n } from '../../shared/i18n'
import { formatVnd } from '../../shared/lib/formatVnd'
import {
  pricingDescription,
  pricingLabel,
} from '../../shared/lib/pricingPresentation'
import { financeApi } from './api'
import type { Invoice, Quote } from './types'
import { customerFinancePanelMessages } from './CustomerFinancePanel.messages'
import './finance.css'

export function CustomerFinancePanel({ orderId }: { orderId: string }) {
  const { t } = useI18n(customerFinancePanelMessages)
  const [quote, setQuote] = useState<Quote | null>(null)
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const [quoteResult, invoiceResult] = await Promise.allSettled([
      financeApi.getQuote(orderId),
      financeApi.getInvoice(orderId),
    ])
    if (quoteResult.status === 'fulfilled') setQuote(quoteResult.value)
    else if (!isNotFound(quoteResult.reason))
      setError(quoteResult.reason)
    if (invoiceResult.status === 'fulfilled') setInvoice(invoiceResult.value)
    else if (!isNotFound(invoiceResult.reason))
      setError(invoiceResult.reason)
    setLoading(false)
  }, [orderId])

  useEffect(() => {
    void load()
  }, [load])

  async function accept() {
    if (!quote) return
    setBusy(true)
    setError(null)
    try {
      setInvoice(await financeApi.acceptQuote(orderId, quote.id))
      await load()
    } catch (cause) {
      setError(cause)
    } finally {
      setBusy(false)
    }
  }

  async function pay(kind: 'deposit' | 'final') {
    if (!invoice) return
    setBusy(true)
    setError(null)
    try {
      const payment =
        kind === 'deposit'
          ? await financeApi.createDeposit(invoice.id)
          : await financeApi.createFinalPayment(invoice.id)
      if (!payment.paymentUrl)
        throw new Error(t.missingPaymentUrl)
      window.location.assign(payment.paymentUrl)
    } catch (cause) {
      setError(cause)
      setBusy(false)
    }
  }

  if (loading && !quote && !invoice)
    return (
      <section className="ui-card customer-finance-card">
        {t.loading}
      </section>
    )
  if (!quote && !invoice && !error) return null

  return (
    <section
      className="ui-card customer-finance-card"
      aria-labelledby="customer-quote-title"
    >
      <header className="customer-finance-head">
        <div>
          <h2 id="customer-quote-title">{t.title}</h2>
          <p>{t.description}</p>
        </div>
        {quote ? (
          <span className="finance-status">Báo giá v{quote.version}</span>
        ) : null}
      </header>

      {quote ? (
        <div className="customer-quote-body">
          <div className="customer-quote-items">
            {quote.items
              .filter((item) => item.type !== 'ADJUSTMENT')
              .map((item) => (
                <div key={item.id}>
                  <span>
                    <b>
                      {item.type === 'INCLUDED' ? '✓ ' : ''}
                      {pricingDescription(item.description)}
                    </b>
                    <small>
                      {item.type === 'ADDITIONAL'
                        ? 'Yêu cầu bổ sung'
                        : item.type === 'PACKAGE'
                          ? 'Gói dịch vụ'
                          : item.type === 'MANAGER_ADJUSTMENT'
                            ? 'Điều chỉnh đã được phê duyệt'
                            : item.type === 'DISCOUNT'
                              ? 'Ưu đãi tự động'
                              : 'Đã bao gồm'}
                    </small>
                  </span>
                  <strong>{formatVnd(item.amount)}</strong>
                </div>
              ))}
          </div>
          <dl className="finance-summary customer-summary">
            <Summary label="Giá gói" value={quote.packagePrice} />
            <Summary label="Chi phí bổ sung" value={quote.additionalAmount} />
            <Summary label="Giảm giá" value={-quote.discountAmount} />
            <Summary label="Điều chỉnh" value={quote.adjustmentAmount} />
            <Summary label="Tổng cộng" value={quote.totalAmount} total />
          </dl>
          {quote.managerNote ? (
            <p className="customer-manager-note">
              <b>Ghi chú của quản lý:</b> {quote.managerNote}
            </p>
          ) : null}
          {quote.status === 'APPROVED' && !invoice ? (
            <button
              className="odm-btn odm-btn-p"
              type="button"
              disabled={busy}
              onClick={() => void accept()}
            >
              Chấp nhận báo giá
            </button>
          ) : null}
        </div>
      ) : null}

      {invoice ? (
        <div className="customer-invoice">
          <div className="customer-invoice-title">
            <div>
              <h3>Hóa đơn {invoice.invoiceNumber}</h3>
              <p>
                Khoản đặt cọc được xác nhận qua IPN VNPAY trước khi nhiệm vụ bắt
                đầu.
              </p>
            </div>
            <span
              className={`finance-status is-${invoice.status.toLowerCase()}`}
            >
              {pricingLabel(invoice.status)}
            </span>
          </div>
          <div className="customer-payment-stats">
            <PaymentStat label="Tổng" value={invoice.totalAmount} />
            <PaymentStat
              label="Tiền đặt cọc (30%)"
              value={invoice.depositAmount}
            />
            <PaymentStat label="Đã thanh toán" value={invoice.paidAmount} />
            <PaymentStat label="Còn lại" value={invoice.remainingAmount} />
          </div>
          {invoice.paidAmount < invoice.depositAmount ? (
            <div className="customer-deposit-notice">
              <b>Đang chờ đặt cọc</b>
              <span>
                Nhiệm vụ đã được tạo nhưng chỉ bắt đầu phân bổ nguồn lực sau khi
                khoản đặt cọc được xác nhận.
              </span>
            </div>
          ) : invoice.status !== 'PAID' ? (
            <div className="customer-deposit-notice is-ready">
              <b>Đã nhận tiền đặt cọc</b>
              <span>Nhiệm vụ đã được mở khóa cho quy trình vận hành.</span>
            </div>
          ) : null}
          <div className="finance-actions customer-payment-actions">
            {invoice.paidAmount < invoice.depositAmount ? (
              <button
                className="odm-btn odm-btn-p"
                type="button"
                disabled={busy}
                onClick={() => void pay('deposit')}
              >
                Thanh toán đặt cọc
              </button>
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
                Thanh toán phần còn lại
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
      {error ? (
        <p className="finance-alert is-error" role="alert">
          {messageOf(error, t)}
        </p>
      ) : null}
    </section>
  )
}

function Summary({
  label,
  value,
  total = false,
}: {
  label: string
  value: number
  total?: boolean
}) {
  return (
    <div className={total ? 'is-total' : ''}>
      <dt>{label}</dt>
      <dd>{formatVnd(value)}</dd>
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
function isNotFound(error: unknown) {
  return error instanceof ApiError && error.status === 404
}
function messageOf(error: unknown, t: (typeof customerFinancePanelMessages)['vi']) {
  if (error instanceof ApiError) {
    if (error.code === 'NETWORK_ERROR') {
      return t.networkError
    }
    if (error.code === 'PAYMENT_PROVIDER_ERROR') {
      return t.paymentProviderError
    }
    const messages: Record<string, string> = {
      INVOICE_ALREADY_PAID: 'Hóa đơn này đã được thanh toán đầy đủ.',
      INVOICE_NOT_PAYABLE: 'Hóa đơn hiện không thể thanh toán.',
      DEPOSIT_ALREADY_SATISFIED: 'Khoản đặt cọc đã được thanh toán.',
      ACTIVE_PAYMENT_EXISTS: 'Đang có một giao dịch thanh toán chưa hoàn tất.',
      QUOTE_NOT_APPROVED: 'Báo giá chưa được phê duyệt.',
      QUOTE_NOT_CURRENT: 'Báo giá này không còn là phiên bản hiện hành.',
    }
    if (error.code && messages[error.code]) {
      return messages[error.code]
    }
    return t.loadError
  }
  return error instanceof Error
    ? error.message
    : t.loadError
}
