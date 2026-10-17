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
  quotePending: boolean
}

/** `total = checklistSubtotal + sum(addOns)`; order-specific factors are added by the Manager quote. */
export type PriceAddOn = { key: string; description: string; amount: number }

export type ServicePricePreview = {
  serviceId: string
  serviceName: string
  currency: string
  policyId: string
  policyVersion: number
  draftPolicy: boolean
  /** CHECKLISTS: the price is the sum of the checklists. UNPRICED: no default checklist carries a price yet. */
  priceSource: 'CHECKLISTS' | 'UNPRICED'
  packageFee: number
  checklists: ChecklistPriceBreakdown[]
  checklistSubtotal: number
  total: number
  complete: boolean
  warnings: string[]
  quotePending: boolean
  /** Order-level extras priced by the policy (for example AI image analysis). */
  addOns?: PriceAddOn[]
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
export type ChecklistQuoteContext = {
  areaHa?: number
  lengthKm?: number
  altitudeM?: number
  aiAnalysisRequested?: boolean
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
    context?: ChecklistQuoteContext,
  ) =>
    apiRequest<ServicePricePreview>('/api/pricing/checklist-quote', {
      method: 'POST',
      body: { serviceId, items, ...context },
      signal,
    }),
}
