export type ChecklistReviewStatus =
  'PENDING' | 'INCLUDED' | 'ADDITIONAL' | 'DUPLICATE' | 'REJECTED'

export type PricingChecklistItem = {
  id: string
  sourceChecklistId: string | null
  content: string
  displayOrder: number
  sourceType: 'SERVICE_TEMPLATE' | 'CUSTOMER_CUSTOM'
  reviewStatus: ChecklistReviewStatus
  managerNote: string | null
}

export type QuoteItem = {
  id: string
  orderChecklistItemId: string | null
  type: 'PACKAGE' | 'INCLUDED' | 'ADDITIONAL' | 'ADJUSTMENT'
  description: string
  quantity: number
  unitPrice: number
  amount: number
  displayOrder: number
}

export type Quote = {
  id: string
  orderId: string
  version: number
  status:
    | 'DRAFT'
    | 'PENDING_REVIEW'
    | 'APPROVED'
    | 'REJECTED'
    | 'ACCEPTED_BY_CUSTOMER'
    | 'EXPIRED'
    | 'SUPERSEDED'
  packagePrice: number
  additionalAmount: number
  discountAmount: number
  adjustmentAmount: number
  totalAmount: number
  managerNote: string | null
  approvedByName: string | null
  approvedAt: string | null
  acceptedAt: string | null
  items: QuoteItem[]
}

export type Invoice = {
  id: string
  invoiceNumber: string
  orderId: string
  quoteId: string
  totalAmount: number
  depositAmount: number
  paidAmount: number
  remainingAmount: number
  status:
    'ISSUED' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED' | 'REFUNDED'
  issuedAt: string
  finalPaymentAllowed: boolean
}

export type Payment = {
  id: string
  invoiceId: string
  paymentCode: number
  type: 'DEPOSIT' | 'FINAL_PAYMENT' | 'REFUND'
  amount: number
  currency: 'VND'
  status:
    'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'REFUNDED'
  provider: 'VNPAY' | 'PAYOS'
  paymentUrl: string | null
  transactionReference: string
  providerTransactionId: string | null
  paidAt: string | null
}

export type PricingReview = {
  orderId: string
  orderCode: string | null
  customerName: string
  serviceName: string
  basePackagePrice: number
  checklistItems: PricingChecklistItem[]
  currentQuote: Quote | null
  quoteHistory: Quote[]
}
