import type {
  ConsultationMessage,
  CustomerConsultation,
} from '../../api/customerApi'

export type Step = 1 | 2 | 3 | 4 | 5
export const STEPS: readonly Step[] = [1, 2, 3, 4, 5]

export type MapPoint = { x: number; y: number }

export type AiScore = {
  score: number
  level: 'good' | 'warn' | 'bad'
  notes: string[]
}

export type SimulationMapMeta = {
  image?: string
  imageVersion?: string
  minX: number
  maxX: number
  minY: number
  maxY: number
  imageBounds?: { minX: number; maxX: number; minY: number; maxY: number }
  width?: number
  height?: number
}

/** Raw zone item as returned by `GET /api/zones` (all fields optional). */
export type ZonePayload = {
  id?: string
  code?: string
  name?: string
  zoneType?: string
  restricted?: boolean
  coordinates?: number[][]
}

export type SimulationZone = {
  id: string
  code: string
  name: string
  zoneType: string
  restricted: boolean
  coordinates: [number, number][]
}

export type UsagePurpose = '' | 'INTERNAL' | 'LEGAL' | 'PARTNER_REPORT' | 'OTHER'
export type PermitStatus = 'NONE' | 'HAVE_PERMIT' | 'NEED_SUPPORT'
export type RequestPriority = 'NORMAL' | 'HIGH' | 'URGENT'
export type RecurrenceType = 'NONE' | 'WEEKLY' | 'MONTHLY'
/** What to do when a flight cannot go ahead (weather, equipment, access, permit, safety). */
export type WeatherFallback = 'AUTO_RESCHEDULE' | 'CONTACT_CUSTOMER' | 'CANCEL_ORDER'

export const RESULT_FORMATS = ['PHOTO', 'VIDEO', 'PDF_REPORT', 'ORTHOMOSAIC', 'MODEL_3D'] as const
export type ResultFormat = (typeof RESULT_FORMATS)[number]
export const DELIVERY_METHODS = ['DOWNLOAD', 'EMAIL', 'API'] as const
export type DeliveryMethod = (typeof DELIVERY_METHODS)[number]
export const RETENTION_DAYS = [30, 90, 180, 365] as const
export type RetentionDays = (typeof RETENTION_DAYS)[number]

export type FormState = {
  title: string
  usagePurpose: UsagePurpose
  priority: RequestPriority
  description: string
  address: string
  latitude: string
  longitude: string
  radiusM: number
  altitudeM: number
  /** Optional estimated length in metres (roads, runways, pipelines). */
  estimatedLengthM: string
  siteContactName: string
  siteContactPhone: string
  accessNotes: string
  permitStatus: PermitStatus
  permitNumber: string
  /** KML / GeoJSON / drawings describing the area. */
  areaFiles: CustomerOrderAttachment[]
  serviceId: string
  preferredDateFrom: string
  preferredDateTo: string
  preferredTimeId: string
  recurrenceType: RecurrenceType
  /** Total number of flights when the request repeats (2-52). */
  recurrenceOccurrences: number
  /** One answer for every reason a flight might not go ahead. */
  weatherFallback: WeatherFallback
  /** ISO date by which the result is needed; empty = no deadline. */
  resultDeadline: string
  deliverableTypeId: string
  mediaType: 'IMAGE' | 'VIDEO'
  quantity: number
  resolution: string
  /** Result formats wanted (photo, video, PDF report, orthomosaic, 3D model); at least one. */
  resultFormats: ResultFormat[]
  /** How the result is received; at least one. */
  deliveryMethods: DeliveryMethod[]
  /** Days the result data is kept after handover. */
  dataRetentionDays: RetentionDays
  /** Customer accepted the terms and the data-security commitment. */
  termsAccepted: boolean
  attachments: CustomerOrderAttachment[]
}

export type CustomerOrderAttachment = {
  id: string
  fileName: string
  contentType: string
  sizeBytes: number
  dataUrl: string
}

export type FormErrors = Partial<Record<keyof FormState, string>>

export type StoredCreateOrderDraft = {
  step?: Step
  form?: FormState
  mapPoint?: MapPoint
  consultation?: CustomerConsultation | null
  chatMessages?: ConsultationMessage[]
  autoDraft?: { title: string; description: string }
  aiAnalysisRequested?: boolean
}

export type UpdateField = <K extends keyof FormState>(
  key: K,
  value: FormState[K],
) => void
