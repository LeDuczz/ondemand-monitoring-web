import { useCallback, useEffect, useRef, useState } from 'react'

import { useI18n } from '../../../shared/i18n'
import { financeApi } from '../api'
import type { Payment } from '../types'
import { PaymentResultCard } from './components/PaymentResultCard'
import { paymentResultPageMessages } from './PaymentResultPage.messages'
import '../finance.css'

type PaymentError = {
  key: 'missingReference' | 'checkFailed' | 'retryFailed'
  message?: string
}

export function PaymentResultPage({
  cancelled = false,
}: {
  cancelled?: boolean
}) {
  const { t } = useI18n(paymentResultPageMessages)
  const transactionReference = readTransactionReference()
  const [payment, setPayment] = useState<Payment | null>(null)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState<PaymentError | null>(null)
  const attempts = useRef(0)

  const check = useCallback(async () => {
    if (!transactionReference) {
      setChecking(false)
      setError({ key: 'missingReference' })
      return
    }
    setChecking(true)
    setError(null)
    try {
      // The refresh endpoint performs a signed server-to-server QueryDR call.
      // Browser return parameters are never used as proof of payment.
      const current = cancelled
        ? await financeApi.getPaymentByReference(transactionReference)
        : await financeApi.refreshPaymentByReference(transactionReference)
      setPayment(current)
      const stillProcessing =
        current.status === 'PENDING' || current.status === 'PROCESSING'
      if (stillProcessing && !cancelled && attempts.current < 10) {
        attempts.current += 1
        window.setTimeout(() => void check(), 3000)
        return
      }
    } catch (cause) {
      setError({
        key: 'checkFailed',
        message: cause instanceof Error ? cause.message : undefined,
      })
    }
    setChecking(false)
  }, [cancelled, transactionReference])

  useEffect(() => {
    void check()
  }, [check])

  async function retryPayment() {
    if (!payment) return
    setChecking(true)
    setError(null)
    try {
      const next =
        payment.type === 'FINAL_PAYMENT'
          ? await financeApi.createFinalPayment(payment.invoiceId)
          : await financeApi.createDeposit(payment.invoiceId)
      if (next.paymentUrl) window.location.assign(next.paymentUrl)
    } catch (cause) {
      setChecking(false)
      setError({
        key: 'retryFailed',
        message: cause instanceof Error ? cause.message : undefined,
      })
    }
  }

  return (
    <main className="payment-result-page">
      <PaymentResultCard
        payment={payment}
        cancelled={cancelled}
        checking={checking}
        error={error ? (error.message ?? t[error.key]) : null}
        onRefresh={() => void check()}
        onRetry={() => void retryPayment()}
      />
    </main>
  )
}

function readTransactionReference() {
  const query = window.location.hash.split('?')[1] ?? ''
  const parameters = new URLSearchParams(query)
  const value =
    parameters.get('transactionReference') ?? parameters.get('vnp_TxnRef')
  return value && /^[A-Za-z0-9]{1,100}$/.test(value) ? value : null
}
