import { todayPlus } from './format'
import type { FormState, Step, StoredCreateOrderDraft } from './types'

export const CREATE_ORDER_DRAFT_STORAGE_KEY = 'odm.customer.createOrderDraft.v2'

export function createDefaultForm(): FormState {
  return {
    title: '',
    usagePurpose: '',
    priority: 'NORMAL',
    description: '',
    address: '',
    latitude: '10.6402',
    longitude: '106.6912',
    radiusM: 300,
    altitudeM: 60,
    estimatedLengthM: '',
    siteContactName: '',
    siteContactPhone: '',
    accessNotes: '',
    permitStatus: 'NONE',
    permitNumber: '',
    areaFiles: [],
    serviceId: '',
    preferredDateFrom: todayPlus(1),
    preferredDateTo: todayPlus(1),
    preferredTimeId: '',
    recurrenceType: 'NONE',
    recurrenceOccurrences: 4,
    weatherFallback: 'CONTACT_CUSTOMER',
    resultDeadline: '',
    deliverableTypeId: '',
    mediaType: 'IMAGE',
    quantity: 10,
    resolution: '4K',
    resultFormats: ['PHOTO'],
    deliveryMethods: ['DOWNLOAD'],
    dataRetentionDays: 90,
    termsAccepted: false,
    attachments: [],
  }
}

export function isStep(value: unknown): value is Step {
  return value === 1 || value === 2 || value === 3 || value === 4 || value === 5
}

export function readStoredDraft(): StoredCreateOrderDraft | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(CREATE_ORDER_DRAFT_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as StoredCreateOrderDraft) : null
  } catch {
    return null
  }
}

export function writeStoredDraft(draft: StoredCreateOrderDraft) {
  try {
    window.localStorage.setItem(
      CREATE_ORDER_DRAFT_STORAGE_KEY,
      JSON.stringify(draft),
    )
  } catch {
    // Storage may be full or blocked; the draft is a convenience only.
  }
}

export function clearStoredDraft() {
  try {
    window.localStorage.removeItem(CREATE_ORDER_DRAFT_STORAGE_KEY)
  } catch {
    // ignore
  }
}
