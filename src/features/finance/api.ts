import { apiRequest } from '../../shared/api/httpClient'
import type {
  ChecklistReviewStatus,
  Invoice,
  Payment,
  PricingChecklistItem,
  PricingReview,
  Quote,
} from './types'

export const financeApi = {
  getPricingReview: (orderId: string, signal?: AbortSignal) =>
    apiRequest<PricingReview>(
      `/api/manager/orders/${encodeURIComponent(orderId)}/pricing`,
      { signal },
    ),
  reviewChecklist: (
    orderId: string,
    itemId: string,
    body: { status: ChecklistReviewStatus; managerNote: string | null },
  ) =>
    apiRequest<PricingChecklistItem>(
      `/api/manager/orders/${encodeURIComponent(orderId)}/checklist-items/${encodeURIComponent(itemId)}`,
      { method: 'PATCH', body },
    ),
  saveDraft: (
    orderId: string,
    body: {
      packagePrice: number
      discountAmount: number
      adjustmentAmount: number
      managerNote: string | null
      additionalUnitPrices: Record<string, number>
    },
  ) =>
    apiRequest<Quote>(
      `/api/manager/orders/${encodeURIComponent(orderId)}/quotes/draft`,
      {
        method: 'PUT',
        body,
      },
    ),
  approveQuote: (orderId: string, quoteId: string) =>
    apiRequest<Quote>(
      `/api/manager/orders/${encodeURIComponent(orderId)}/quotes/${encodeURIComponent(quoteId)}/approve`,
      { method: 'POST' },
    ),
  getQuote: (orderId: string, signal?: AbortSignal) =>
    apiRequest<Quote>(`/api/orders/${encodeURIComponent(orderId)}/quote`, {
      signal,
    }),
  acceptQuote: (orderId: string, quoteId: string) =>
    apiRequest<Invoice>(
      `/api/orders/${encodeURIComponent(orderId)}/quotes/${encodeURIComponent(quoteId)}/accept`,
      { method: 'POST' },
    ),
  getInvoice: (orderId: string, signal?: AbortSignal) =>
    apiRequest<Invoice>(`/api/orders/${encodeURIComponent(orderId)}/invoice`, {
      signal,
    }),
  createDeposit: (invoiceId: string) =>
    apiRequest<Payment>(
      `/api/invoices/${encodeURIComponent(invoiceId)}/payments/deposit`,
      {
        method: 'POST',
      },
    ),
  createFinalPayment: (invoiceId: string) =>
    apiRequest<Payment>(
      `/api/invoices/${encodeURIComponent(invoiceId)}/payments/final`,
      {
        method: 'POST',
      },
    ),
  getPaymentByReference: (
    transactionReference: string,
    signal?: AbortSignal,
  ) =>
    apiRequest<Payment>(
      `/api/payments/by-reference/${encodeURIComponent(transactionReference)}`,
      { signal },
    ),
  refreshPaymentByReference: (transactionReference: string) =>
    apiRequest<Payment>(
      `/api/payments/by-reference/${encodeURIComponent(transactionReference)}/refresh`,
      { method: 'POST' },
    ),
}
