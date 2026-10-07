import { useCallback, useEffect, useRef, useState } from 'react'

import { formatVnd } from '../../shared/lib/formatVnd'
import { financeApi } from './api'
import type { Payment } from './types'
import './finance.css'

export function PaymentResultPage({
  cancelled = false,
}: {
  cancelled?: boolean
}) {
  const transactionReference = readTransactionReference()
  const [payment, setPayment] = useState<Payment | null>(null)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const attempts = useRef(0)

  const check = useCallback(async () => {
    if (!transactionReference) {
      setChecking(false)
      setError('Không tìm thấy mã thanh toán trong URL trả về.')
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
      setError(
        cause instanceof Error
          ? cause.message
          : 'Không thể kiểm tra thanh toán.',
      )
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
      setError(
        cause instanceof Error
          ? cause.message
          : 'Không thể tạo lại thanh toán.',
      )
    }
  }

  const success = payment?.status === 'SUCCESS'
  return (
    <main className="payment-result-page">
      <section className="payment-result-card" aria-live="polite">
        <div
          className={`payment-result-icon ${success ? 'is-success' : cancelled ? 'is-cancelled' : ''}`}
          aria-hidden="true"
        >
          {success ? '✓' : cancelled ? '×' : '…'}
        </div>
        <h1>
          {success
            ? 'Thanh toán thành công'
            : cancelled
              ? 'Thanh toán đã hủy'
              : checking
                ? 'Đang kiểm tra thanh toán'
                : 'Thanh toán đang được xác nhận'}
        </h1>
        <p>
          {success
            ? payment?.type === 'DEPOSIT'
              ? 'Deposit đã được ghi nhận. Mission đang được chuẩn bị.'
              : 'Hóa đơn đã được cập nhật với khoản thanh toán cuối.'
            : cancelled
              ? 'Chưa có khoản thu nào được xác nhận từ lần quay lại này.'
              : 'Backend đang xác minh IPN hoặc đối soát trực tiếp trạng thái giao dịch với VNPAY.'}
        </p>
        {payment ? (
          <dl className="payment-result-detail">
            <div>
              <dt>Mã thanh toán</dt>
              <dd>{payment.transactionReference}</dd>
            </div>
            <div>
              <dt>Số tiền</dt>
              <dd>{formatVnd(payment.amount)}</dd>
            </div>
            <div>
              <dt>Trạng thái backend</dt>
              <dd>{payment.status}</dd>
            </div>
          </dl>
        ) : null}
        {error ? (
          <p className="finance-alert is-error" role="alert">
            {error}
          </p>
        ) : null}
        <div className="payment-result-actions">
          {!success && !checking ? (
            <button
              className="odm-btn odm-btn-p"
              type="button"
              onClick={() => void check()}
            >
              Làm mới trạng thái
            </button>
          ) : null}
          {cancelled && payment && !success ? (
            <button
              className="odm-btn"
              type="button"
              onClick={() => void retryPayment()}
            >
              Thử lại
            </button>
          ) : null}
          <a className="odm-btn" href="#portal/customer/orders">
            Về danh sách đơn
          </a>
        </div>
      </section>
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
