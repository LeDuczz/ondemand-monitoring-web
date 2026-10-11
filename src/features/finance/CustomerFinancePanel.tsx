import { useCallback, useEffect, useState } from 'react'

import { ApiError } from '../../shared/api/httpClient'
import { formatVnd } from '../../shared/lib/formatVnd'
import { financeApi } from './api'
import type { Invoice, Quote } from './types'
import './finance.css'

export function CustomerFinancePanel({ orderId }: { orderId: string }) {
  const [quote, setQuote] = useState<Quote | null>(null)
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const [quoteResult, invoiceResult] = await Promise.allSettled([
      financeApi.getQuote(orderId),
      financeApi.getInvoice(orderId),
    ])
    if (quoteResult.status === 'fulfilled') setQuote(quoteResult.value)
    else if (!isNotFound(quoteResult.reason))
      setError(messageOf(quoteResult.reason))
    if (invoiceResult.status === 'fulfilled') setInvoice(invoiceResult.value)
    else if (!isNotFound(invoiceResult.reason))
      setError(messageOf(invoiceResult.reason))
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
      setError(messageOf(cause))
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
        throw new Error('Cổng thanh toán chưa trả về checkout URL.')
      window.location.assign(payment.paymentUrl)
    } catch (cause) {
      setError(messageOf(cause))
      setBusy(false)
    }
  }

  if (loading && !quote && !invoice)
    return (
      <section className="ui-card customer-finance-card">
        Đang tải báo giá...
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
          <h2 id="customer-quote-title">Báo giá và thanh toán</h2>
          <p>Giá được manager xác nhận theo phạm vi yêu cầu của đơn.</p>
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
                      {item.description}
                    </b>
                    <small>
                      {item.type === 'ADDITIONAL'
                        ? 'Yêu cầu bổ sung'
                        : item.type === 'PACKAGE'
                          ? 'Gói dịch vụ'
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
              <b>Ghi chú của manager:</b> {quote.managerNote}
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
              {invoice.status}
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
                Mission đã được tạo nhưng chỉ bắt đầu phân bổ nguồn lực sau khi
                khoản đặt cọc được xác nhận.
              </span>
            </div>
          ) : invoice.status !== 'PAID' ? (
            <div className="customer-deposit-notice is-ready">
              <b>Đã nhận tiền đặt cọc</b>
              <span>Mission đã được mở khóa cho quy trình vận hành.</span>
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
          {error}
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
function messageOf(error: unknown) {
  if (error instanceof ApiError && error.code === 'PAYMENT_PROVIDER_ERROR') {
    return 'Không thể khởi tạo thanh toán VNPAY. Vui lòng kiểm tra cấu hình cổng thanh toán hoặc thử lại sau.'
  }
  return error instanceof Error
    ? error.message
    : 'Không thể tải dữ liệu tài chính.'
}
