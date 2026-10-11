import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ApiError } from '../../shared/api/httpClient'
import { financeApi } from './api'
import { CustomerFinancePanel } from './CustomerFinancePanel'
import type { Invoice, Payment, Quote } from './types'

const quote: Quote = {
  id: 'quote-1',
  orderId: 'order-1',
  version: 1,
  status: 'APPROVED',
  packagePrice: 5_000_000,
  additionalAmount: 0,
  discountAmount: 0,
  adjustmentAmount: 0,
  totalAmount: 5_000_000,
  managerNote: null,
  approvedByName: 'Manager',
  approvedAt: '2026-10-06T08:00:00Z',
  acceptedAt: null,
  items: [],
}

const invoice: Invoice = {
  id: 'invoice-1',
  invoiceNumber: 'INV-1',
  orderId: 'order-1',
  quoteId: 'quote-1',
  totalAmount: 5_000_000,
  depositAmount: 1_500_000,
  paidAmount: 0,
  remainingAmount: 5_000_000,
  status: 'ISSUED',
  issuedAt: '2026-10-06T08:00:00Z',
  finalPaymentAllowed: false,
}

const pendingDeposit: Payment = {
  id: 'payment-1',
  invoiceId: 'invoice-1',
  paymentCode: 123456,
  type: 'DEPOSIT',
  amount: 1_500_000,
  currency: 'VND',
  status: 'PENDING',
  provider: 'VNPAY',
  paymentUrl: null,
  transactionReference: '1760000000000123456',
  providerTransactionId: null,
  paidAt: null,
}

afterEach(() => vi.restoreAllMocks())

describe('CustomerFinancePanel', () => {
  it('lets the customer accept an approved quote and start the deposit payment', async () => {
    vi.spyOn(financeApi, 'getQuote').mockResolvedValue(quote)
    vi.spyOn(financeApi, 'getInvoice')
      .mockRejectedValueOnce(
        new ApiError('Not found', {
          status: 404,
          method: 'GET',
          path: '/api/orders/order-1/invoice',
        }),
      )
      .mockResolvedValue(invoice)
    vi.spyOn(financeApi, 'acceptQuote').mockResolvedValue(invoice)
    const createDeposit = vi
      .spyOn(financeApi, 'createDeposit')
      .mockResolvedValue(pendingDeposit)

    render(<CustomerFinancePanel orderId="order-1" />)
    fireEvent.click(
      await screen.findByRole('button', { name: 'Chấp nhận báo giá' }),
    )

    const depositButton = await screen.findByRole('button', {
      name: 'Thanh toán đặt cọc',
    })
    expect(screen.getByText(/Tiền đặt cọc \(30%\)/)).toBeInTheDocument()
    fireEvent.click(depositButton)

    await waitFor(() => expect(createDeposit).toHaveBeenCalledWith('invoice-1'))
    expect(
      await screen.findByText('Cổng thanh toán chưa trả về checkout URL.'),
    ).toBeInTheDocument()
  })
})
