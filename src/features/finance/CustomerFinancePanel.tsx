import { useCallback, useEffect, useState } from 'react'

import { ApiError } from '../../shared/api/httpClient'
import { useI18n } from '../../shared/i18n'
import { formatVnd } from '../../shared/lib/formatVnd'
import {
  pricingDescription,
  pricingLabel,
} from '../../shared/lib/pricingPresentation'
import { financeApi } from './api'
import { customerFinancePanelMessages } from './CustomerFinancePanel.messages'
import type { CustomerQuote, Invoice } from './types'
import './finance.css'

export type CustomerFinanceState = {
  quote: CustomerQuote | null
  invoice: Invoice | null
  loading: boolean
}

const invoiceStatusLabels: Record<string, string> = {
  ISSUED: 'Chờ thanh toán',
  PARTIALLY_PAID: 'Đã thanh toán một phần',
  PAID: 'Đã thanh toán',
  OVERDUE: 'Quá hạn',
  CANCELLED: 'Đã hủy',
  REFUNDED: 'Đã hoàn tiền',
}

export function CustomerFinancePanel({
  orderId,
  legalStatus,
  onStateChange,
}: {
  orderId: string
  legalStatus?: 'NOT_REVIEWED' | 'NOT_REQUIRED' | 'PENDING_PERMIT' | 'APPROVED' | 'REJECTED'
  onStateChange?: (state: CustomerFinanceState) => void
}) {
  const legalReady =
    legalStatus == null ||
    legalStatus === 'NOT_REQUIRED' ||
    legalStatus === 'APPROVED' ||
    legalStatus === 'PENDING_PERMIT'
  const { t } = useI18n(customerFinancePanelMessages)
  const [quote, setQuote] = useState<CustomerQuote | null>(null)
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
      setError(messageOf(quoteResult.reason, t))
    if (invoiceResult.status === 'fulfilled') setInvoice(invoiceResult.value)
    else if (!isNotFound(invoiceResult.reason))
      setError(messageOf(invoiceResult.reason, t))
    setLoading(false)
  }, [orderId, t])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    onStateChange?.({ quote, invoice, loading })
  }, [invoice, loading, onStateChange, quote])

  async function accept() {
    if (!quote) return
    setBusy(true)
    setError(null)
    try {
      setInvoice(await financeApi.acceptQuote(orderId, quote.id))
      await load()
    } catch (cause) {
      setError(messageOf(cause, t))
    } finally {
      setBusy(false)
    }
  }

  async function pay(type: 'deposit' | 'final') {
    if (!invoice) return
    setBusy(true)
    setError(null)
    try {
      const payment =
        type === 'deposit'
          ? await financeApi.createDeposit(invoice.id)
          : await financeApi.createFinalPayment(invoice.id)
      if (!payment.paymentUrl)
        throw new Error(t.missingPaymentUrl)
      window.location.assign(payment.paymentUrl)
    } catch (cause) {
      setError(messageOf(cause, t))
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
          <QuoteLines items={quote.items} />
          <dl className="finance-summary customer-summary">
            <Summary
              label="Chi phí dự kiến"
              value={quote.estimatedBaseAmount}
            />
            <Summary label="Dịch vụ bổ sung" value={quote.approvedAdditionalServiceAmount} />
            <Summary label="Tổng đơn hàng" value={quote.finalOrderAmount} total />
          </dl>
          <p className="co-estimate-notice">Báo giá dự kiến chưa bao gồm dịch vụ theo yêu cầu.</p>
          {!legalReady ? (
            <div className="customer-deposit-notice">
              <b>{legalStatus === 'REJECTED' ? 'Đơn hàng không thể thực hiện' : 'Đang xác minh điều kiện khu vực bay'}</b>
              <span>
                {legalStatus === 'REJECTED'
                  ? 'Đơn hàng không thể thực hiện do điều kiện khu vực bay.'
                  : 'Chúng tôi đang xác minh các điều kiện cần thiết trước khi đơn hàng có thể tiếp tục.'}
              </span>
            </div>
          ) : legalStatus === 'PENDING_PERMIT' ? (
            <div className="customer-deposit-notice">
              <b>Đang xác minh giấy phép bay</b>
              <span>
                Bạn vẫn có thể tiếp tục. Chúng tôi sẽ cập nhật khi giấy phép được xác nhận.
              </span>
            </div>
          ) : null}
          {quote.status === 'APPROVED' && !invoice && legalReady ? (
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
              {invoiceStatusLabels[invoice.status] ?? pricingLabel(invoice.status)}
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
                Kế hoạch thực hiện và Mission sẽ được mở sau khi khoản đặt cọc
                được xác nhận.
              </span>
            </div>
          ) : invoice.status !== 'PAID' ? (
            <div className="customer-deposit-notice is-ready">
              <b>Đã nhận tiền đặt cọc</b>
              <span>Nhiệm vụ đã được mở khóa cho quy trình vận hành.</span>
            </div>
          ) : null}
          <div className="finance-actions customer-payment-actions">
            {invoice.paidAmount < invoice.depositAmount && legalReady ? (
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
function messageOf(error: unknown, t: (typeof customerFinancePanelMessages)['vi']) {
  if (error instanceof ApiError) {
    if (error.code === 'NETWORK_ERROR') {
      return t.networkError
    }
    if (error.code === 'PAYMENT_PROVIDER_ERROR') {
      return 'Không thể khởi tạo thanh toán VNPAY. Vui lòng kiểm tra cấu hình cổng thanh toán hoặc thử lại sau.'
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


const KIND_LABELS: Record<string, string> = {
  ADDITIONAL: 'Yêu cầu bổ sung',
  PACKAGE: 'Gói dịch vụ',
  MANAGER_ADJUSTMENT: 'Điều chỉnh đã được phê duyệt',
  DISCOUNT: 'Ưu đãi tự động',
}

/** Quote lines grouped per checklist (heading + subtotal), then the order-level lines. */
function QuoteLines({ items }: { items: CustomerQuote['items'] }) {
  const lines = items.filter((item) => item.type !== 'ADJUSTMENT')
  const groups = new Map<string, CustomerQuote['items']>()
  const orderLevel: CustomerQuote['items'] = []
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
  const sum = (rows: CustomerQuote['items']) =>
    rows.reduce((total, row) => total + row.amount, 0)
  return (
    <div className="customer-quote-groups">
      {[...groups.entries()].map(([id, rows]) => {
        const name = (pricingDescription(rows[0].description).split(' · ')[0]) || 'Nội dung'
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
            <strong>Theo đơn hàng</strong>
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

function lineText(row: CustomerQuote['items'][number], checklistName?: string) {
  if (row.type === 'MANAGER_ADJUSTMENT') {
    const reason = row.description.split(' · ').slice(1).join(' · ')
    return reason ? `${KIND_LABELS.MANAGER_ADJUSTMENT}: ${reason}` : KIND_LABELS.MANAGER_ADJUSTMENT
  }
  const text = pricingDescription(row.description)
  const prefix = checklistName ? `${checklistName} · ` : ''
  return prefix && text.startsWith(prefix) ? text.slice(prefix.length) : text
}
