import { apiRequest } from '../../shared/api/httpClient'
import type {
  ChecklistReviewStatus,
  Invoice,
  Payment,
  PricingChecklistItem,
  PricingReview,
  Quote,
  CustomWorkAssessment,
} from './types'

export const financeApi = {
  getAssessment: (orderId: string, signal?: AbortSignal) =>
    apiRequest<CustomWorkAssessment | null>(`/api/manager/orders/${encodeURIComponent(orderId)}/pricing-assessment`, { signal }),
  saveAssessment: (orderId: string, body: CustomWorkAssessment) =>
    apiRequest<CustomWorkAssessment>(`/api/manager/orders/${encodeURIComponent(orderId)}/pricing-assessment`, { method: 'PUT', body }),
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
      adjustmentReason?: string | null
      adjustmentType?: 'DISCOUNT' | 'PROMOTION' | 'COMPENSATION' | 'GOODWILL' | 'CORRECTION'
      expectedPricingRevision?: number | null
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
  decidePricing: (orderId: string, quoteId: string, pricingRevision: number, approved: boolean, note: string | null) =>
    apiRequest<Quote>(
      `/api/manager/orders/${encodeURIComponent(orderId)}/quotes/${encodeURIComponent(quoteId)}/pricing-decision`,
      { method: 'POST', body: { pricingRevision, approved, note } },
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
