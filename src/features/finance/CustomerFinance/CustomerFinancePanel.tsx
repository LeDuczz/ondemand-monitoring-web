import { useCallback, useEffect, useState } from 'react'

import { ApiError } from '../../../shared/api/httpClient'
import { useI18n } from '../../../shared/i18n'
import { FinanceAlert } from '../components/common/FinanceAlert'
import { financeApi } from '../api'
import type { CustomerQuote, Invoice, LegalReviewStatus } from '../types'
import { InvoiceSection } from './components/InvoiceSection'
import { QuoteSection } from './components/QuoteSection'
import { customerFinancePanelMessages } from './CustomerFinancePanel.messages'
import '../finance.css'

export type CustomerFinanceState = {
  quote: CustomerQuote | null
  invoice: Invoice | null
  loading: boolean
}

export function CustomerFinancePanel({
  orderId,
  legalStatus,
  onStateChange,
}: {
  orderId: string
  /** Legal review of the flight area; the quote can only be accepted and paid once it allows the order to go on. */
  legalStatus?: LegalReviewStatus | null
  onStateChange?: (state: CustomerFinanceState) => void
}) {
  const { t } = useI18n(customerFinancePanelMessages)
  const legalReady =
    legalStatus == null ||
    legalStatus === 'NOT_REQUIRED' ||
    legalStatus === 'APPROVED' ||
    legalStatus === 'PENDING_PERMIT'
  const [quote, setQuote] = useState<CustomerQuote | null>(null)
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
    else if (!isNotFound(quoteResult.reason)) setError(quoteResult.reason)
    if (invoiceResult.status === 'fulfilled') setInvoice(invoiceResult.value)
    else if (!isNotFound(invoiceResult.reason)) setError(invoiceResult.reason)
    setLoading(false)
  }, [orderId])

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
      if (!payment.paymentUrl) throw new Error(t.noCheckoutUrl)
      window.location.assign(payment.paymentUrl)
    } catch (cause) {
      setError(cause)
      setBusy(false)
    }
  }

  if (loading && !quote && !invoice)
    return (
      <section className="ui-card customer-finance-card">{t.loading}</section>
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
          <p>{t.subtitle}</p>
        </div>
        {quote ? (
          <span className="finance-status">
            {t.quoteVersion(quote.version)}
          </span>
        ) : null}
      </header>
      {quote ? (
        <QuoteSection
          quote={quote}
          invoice={invoice}
          legalStatus={legalStatus}
          legalReady={legalReady}
          busy={busy}
          onAccept={() => void accept()}
        />
      ) : null}
      {invoice ? (
        <InvoiceSection
          invoice={invoice}
          legalReady={legalReady}
          busy={busy}
          onPay={(kind) => void pay(kind)}
        />
      ) : null}
      {error ? (
        <FinanceAlert tone="error">{messageOf(t, error)}</FinanceAlert>
      ) : null}
    </section>
  )
}

function isNotFound(error: unknown) {
  return error instanceof ApiError && error.status === 404
}
function messageOf(
  t: {
    providerError: string
    loadError: string
    networkError: string
    errors: Record<string, string>
  },
  error: unknown,
) {
  if (error instanceof ApiError) {
    if (error.code === 'NETWORK_ERROR') return t.networkError
    if (error.code === 'PAYMENT_PROVIDER_ERROR') return t.providerError
    if (error.code && t.errors[error.code]) return t.errors[error.code]
    return t.loadError
  }
  return error instanceof Error ? error.message : t.loadError
}
