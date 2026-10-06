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

export type FormState = {
  title: string
  description: string
  address: string
  latitude: string
  longitude: string
  radiusM: number
  serviceId: string
  preferredDateFrom: string
  preferredDateTo: string
  preferredTimeId: string
  deliverableTypeId: string
  mediaType: 'IMAGE' | 'VIDEO'
  quantity: number
  resolution: string
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
