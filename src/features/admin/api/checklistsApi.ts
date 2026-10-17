import { apiRequest } from '../../../shared/api/httpClient'

export type ChecklistDefinition = {
  id: string
  content: string
  isActive: boolean
  createdAt: string
  updatedAt: string | null
  version: number
  difficulty?: 'BASIC' | 'MEDIUM' | 'HARD' | 'VERY_HARD'
  /** Price of the inspection work itself (whole VND). Media is priced by the pricing profile. */
  basePrice?: number
  includedImageCount?: number
  includedVideoCount?: number
  standardVideoDurationSeconds?: number | null
  pricingProfile?: string | null
  areaPricingEnabled?: boolean
  lengthPricingEnabled?: boolean
  altitudePricingEnabled?: boolean
  includedAreaHa?: number
  includedLengthKm?: number
  includedAltitudeM?: number
}
/** Pricing configuration sent with create/edit; omitted fields keep the stored value. */
export type ChecklistPricingInput = {
  basePrice?: number
  includedImageCount?: number
  includedVideoCount?: number
  standardVideoDurationSeconds?: number | null
  pricingProfile?: string | null
  areaPricingEnabled?: boolean
  lengthPricingEnabled?: boolean
  altitudePricingEnabled?: boolean
  includedAreaHa?: number
  includedLengthKm?: number
  includedAltitudeM?: number
}
export type ChecklistPage = {
  items: ChecklistDefinition[]
  page: number
  totalItems: number
  totalPages: number
  first: boolean
  last: boolean
}
export type ServiceChecklist = {
  id: string
  serviceId: string
  serviceName: string
  serviceActive: boolean
  checklistId: string
  content: string
  checklistActive: boolean
  displayOrder: number
  version: number
  checklistVersion: number
  required?: boolean
  /** Effective values: the association override, else inherited from the checklist. */
  basePrice?: number
  includedImageCount?: number
  includedVideoCount?: number
  pricingProfile?: string | null
  standardVideoDurationSeconds?: number | null
  basePriceOverride?: number | null
  includedImageCountOverride?: number | null
  includedVideoCountOverride?: number | null
  pricingProfileOverride?: string | null
  checklistBasePrice?: number
  checklistIncludedImageCount?: number
  checklistIncludedVideoCount?: number
  checklistPricingProfile?: string | null
}
/** Replaces the per-service overrides; null inherits the checklist definition. */
export type ServiceChecklistPricingInput = {
  basePriceOverride: number | null
  includedImageCountOverride: number | null
  includedVideoCountOverride: number | null
  pricingProfileOverride: string | null
  required: boolean
  expectedVersion?: number
}
const enc = encodeURIComponent
const catalog = '/api/admin/checklists'
const template = (id: string) => `/api/admin/services/${enc(id)}/checklists`
export const checklistsApi = {
  list(
    search: string,
    active: boolean | undefined,
    page: number,
    signal?: AbortSignal,
    size = 20,
  ) {
    return apiRequest<ChecklistPage>(catalog, {
      query: {
        search: search.trim() || undefined,
        active,
        page,
        size,
        sort: 'createdAt,desc',
      },
      signal,
    })
  },
  create(
    content: string,
    difficulty?: ChecklistDefinition['difficulty'],
    pricing?: ChecklistPricingInput,
  ) {
    return apiRequest<ChecklistDefinition>(catalog, {
      method: 'POST',
      body: { content, ...(difficulty ? { difficulty } : {}), ...pricing },
    })
  },
  update(
    id: string,
    content: string,
    difficulty?: ChecklistDefinition['difficulty'],
    pricing?: ChecklistPricingInput,
  ) {
    return apiRequest<ChecklistDefinition>(`${catalog}/${enc(id)}`, {
      method: 'PUT',
      body: { content, ...(difficulty ? { difficulty } : {}), ...pricing },
    })
  },
  status(id: string, active: boolean) {
    return apiRequest<ChecklistDefinition>(`${catalog}/${enc(id)}/status`, {
      method: 'PATCH',
      body: { active },
    })
  },
  services(id: string, signal?: AbortSignal) {
    return apiRequest<ServiceChecklist[]>(`${catalog}/${enc(id)}/services`, {
      signal,
    })
  },
  template(id: string, signal?: AbortSignal) {
    return apiRequest<ServiceChecklist[]>(template(id), { signal })
  },
  assign(serviceId: string, checklistId: string, displayOrder: number) {
    return apiRequest<ServiceChecklist>(template(serviceId), {
      method: 'POST',
      body: { checklistId, displayOrder },
    })
  },
  updatePricing(
    serviceId: string,
    checklistId: string,
    input: ServiceChecklistPricingInput,
  ) {
    return apiRequest<ServiceChecklist>(
      `${template(serviceId)}/${enc(checklistId)}/pricing`,
      { method: 'PUT', body: input },
    )
  },
  remove(serviceId: string, checklistId: string) {
    return apiRequest<void>(`${template(serviceId)}/${enc(checklistId)}`, {
      method: 'DELETE',
    })
  },
  reorder(serviceId: string, rows: ServiceChecklist[]) {
    return apiRequest<ServiceChecklist[]>(`${template(serviceId)}/order`, {
      method: 'PUT',
      body: {
        items: rows.map((row) => ({
          checklistId: row.checklistId,
          expectedVersion: row.version,
        })),
      },
    })
  },
}
