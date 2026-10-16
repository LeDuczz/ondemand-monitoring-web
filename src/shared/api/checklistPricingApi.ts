import { apiRequest } from './httpClient'

/** Mirrors `ChecklistPriceBreakdown` (backend). Every line is a component billed exactly once. */
export type ChecklistPriceLine = {
  /** BASE, CUSTOM_BASE, DIFFICULTY, INCLUDED_IMAGE, INCLUDED_VIDEO, EXTRA_IMAGE, EXTRA_VIDEO */
  component: string
  category: string
  description: string
  quantity: number
  unitPrice: number
  amount: number
  tierFrom: number | null
  tierTo: number | null
  blockSize: number | null
  rounding: string | null
}

export type ChecklistPriceBreakdown = {
  checklistId: string | null
  content: string
  pricingProfile: string
  custom: boolean
  includedImageCount: number
  includedVideoCount: number
  requestedImageCount: number
  requestedVideoCount: number
  extraImageCount: number
  extraVideoCount: number
  standardVideoDurationSeconds: number | null
  lines: ChecklistPriceLine[]
  subtotal: number
}

/** `total = packageFee + checklistSubtotal`; order-specific factors are added by the Manager quote. */
export type ServicePricePreview = {
  serviceId: string
  serviceName: string
  currency: string
  policyId: string
  policyVersion: number
  draftPolicy: boolean
  /** CHECKLISTS: the default price is only the checklists. LEGACY_BASE_PRICE: no default checklist is priced yet. */
  priceSource: 'CHECKLISTS' | 'LEGACY_BASE_PRICE'
  packageFee: number
  checklists: ChecklistPriceBreakdown[]
  checklistSubtotal: number
  total: number
  complete: boolean
  warnings: string[]
}

export type AdminPreviewItem = {
  checklistId: string
  basePrice?: number
  includedImageCount?: number
  includedVideoCount?: number
  pricingProfile?: string
  requestedImageCount?: number
  requestedVideoCount?: number
}
export type AdminPreviewRequest = {
  serviceId: string
  packageFee?: number
  policyId?: string
  items?: AdminPreviewItem[]
}

/** Customer input is choices and quantities only; the backend owns every price. */
export type CustomerQuoteItem = {
  sourceChecklistId?: string
  content?: string
  requestedImageCount?: number
  requestedVideoCount?: number
}

export const checklistPricingApi = {
  defaultPrice: (serviceId: string, signal?: AbortSignal) =>
    apiRequest<ServicePricePreview>(
      `/api/admin/pricing/services/${encodeURIComponent(serviceId)}/default-price`,
      { signal },
    ),
  adminPreview: (body: AdminPreviewRequest, signal?: AbortSignal) =>
    apiRequest<ServicePricePreview>('/api/admin/pricing/service-preview', {
      method: 'POST',
      body,
      signal,
    }),
  customerQuote: (
    serviceId: string,
    items: CustomerQuoteItem[],
    signal?: AbortSignal,
  ) =>
    apiRequest<ServicePricePreview>('/api/pricing/checklist-quote', {
      method: 'POST',
      body: { serviceId, items },
      signal,
    }),
}
