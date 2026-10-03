import type {
  ConsultationMessage,
  CustomerConsultation,
  ServiceOption,
} from '../../api/customerApi'
import { calcArea } from './payload'
import type { FormState, MapPoint } from './types'

// RAG retrieval plus the model response can take more than 18 seconds on the
// first request after indexing. Keep one request alive long enough to receive
// the recommendation instead of triggering a duplicate retry.
export const CONSULTATION_REQUEST_TIMEOUT_MS = 35_000

/** A consultation can be resumed only if it is a real, still-open BE session. */
export function isReusableConsultation(
  consultation?: CustomerConsultation | null,
): consultation is CustomerConsultation {
  if (!consultation?.id) return false
  if (consultation.id.startsWith('local-')) return false
  if (consultation.orderId) return false
  return (
    consultation.status !== 'CONFIRMED' && consultation.status !== 'CANCELLED'
  )
}

/** Matches the AI recommendation to a service strictly by id (never by name). */
export function findRecommendedService(
  consultation: CustomerConsultation | null,
  services: ServiceOption[],
) {
  if (!consultation?.recommendedServiceId) return undefined
  return services.find((s) => s.id === consultation.recommendedServiceId)
}

/* eslint-disable @typescript-eslint/no-unused-vars -- messages/service kept for API compatibility */
export function buildDraftFromConsultation(
  consultation: CustomerConsultation,
  _messages: ConsultationMessage[],
  service?: ServiceOption,
) {
  /* eslint-enable @typescript-eslint/no-unused-vars */
  if (
    consultation.status !== 'READY_FOR_CONFIRMATION' &&
    consultation.status !== 'RECOMMENDED'
  ) {
    return { title: '', description: '' }
  }
  return {
    title: buildReadableRequestTitle(consultation, service),
    description: buildReadableRequestDescription(consultation, service),
  }
}

function buildReadableRequestTitle(
  consultation: CustomerConsultation,
  service?: ServiceOption,
) {
  const rawTitle = consultation.requestTitle?.trim() || ''
  const serviceName =
    service?.name?.trim() || consultation.recommendedServiceName?.trim()
  if (
    rawTitle &&
    rawTitle.length <= 80 &&
    !isSystemDraftSummary(rawTitle) &&
    !/^tôi muốn\b/i.test(rawTitle) &&
    !/^tư vấn\b/i.test(rawTitle)
  ) {
    return rawTitle
  }
  if (serviceName) {
    return /^giám sát\b/i.test(serviceName) ? serviceName : `Giám sát ${serviceName}`
  }

  const need = extractNeed(consultation.requestSummary?.trim() || '').trim()
  return shortenTitle(cleanupSentence(need).replace(/[.!?]$/, ''))
}

function buildReadableRequestDescription(
  consultation: CustomerConsultation,
  service?: ServiceOption,
) {
  const raw = consultation.requestSummary?.trim() || ''
  if (!raw) return ''

  const serviceName =
    service?.name?.trim() || consultation.recommendedServiceName?.trim()
  const need = extractNeed(raw).trim() || consultation.requirementSummary?.trim()

  if (!isSystemDraftSummary(raw)) return cleanupSentence(raw)

  return [
    need ? `Nhu cầu giám sát: ${cleanupSentence(need)}` : '',
    serviceName ? `Dịch vụ phù hợp: ${serviceName}.` : '',
    'Mục tiêu: ghi nhận dữ liệu khu vực giám sát và bàn giao kết quả theo loại đã chọn.',
  ]
    .filter(Boolean)
    .join('\n')
}

function shortenTitle(text: string) {
  if (!text) return ''
  return text.length <= 80 ? text : `${text.slice(0, 77).trim()}...`
}

function isSystemDraftSummary(text: string) {
  const normalized = text.toLowerCase()
  return (
    normalized.includes('gợi ý service') ||
    normalized.includes('deliverable') ||
    normalized.includes('dựa trên nhu cầu:')
  )
}

function extractNeed(text: string) {
  const afterNeed = text.match(/dựa trên nhu cầu:\s*(.*?)(?:\.\s*Ghi nhận|\.\s*Dữ liệu|\s*$)/i)
  if (afterNeed?.[1]) return afterNeed[1]
  return text
}

function cleanupSentence(text: string) {
  const cleaned = text
    .replace(/\s+/g, ' ')
    .replace(/\.\.+/g, '.')
    .replace(/\s+([,.])/g, '$1')
    .trim()

  if (!cleaned) return ''
  return /[.!?]$/.test(cleaned) ? cleaned : `${cleaned}.`
}

const KNOWN_STATUSES = [
  'ACTIVE',
  'NEED_MORE_INFO',
  'RECOMMENDED',
  'READY_FOR_CONFIRMATION',
  'COMPLETED',
  'CONFIRMED',
  'CANCELLED',
] as const
export type ConsultationStatusKey =
  | (typeof KNOWN_STATUSES)[number]
  | 'UPDATING'
  | 'NOT_STARTED'

export function consultationStatusKey(status?: string): ConsultationStatusKey {
  const known = KNOWN_STATUSES.find((s) => s === status)
  if (known) return known
  return status ? 'UPDATING' : 'NOT_STARTED'
}

/** Reads a yes/no answer to the AI image-analysis question; undefined if unclear. */
export function parseAiAnalysisAnswer(text: string): boolean | undefined {
  const normalized = text
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (/^(co|ok|okay|duoc|can|yes|y)\b/.test(normalized)) return true
  if (/^(khong|ko|k|no|n|thoi)\b/.test(normalized)) return false
  return undefined
}

/**
 * Context block sent to the AI consultant with every message. It is an LLM
 * prompt (the consultant is Vietnamese-first), not UI text.
 */
export function buildConsultationRequestContext(input: {
  form: FormState
  mapPoint: MapPoint
  services?: ServiceOption[]
  serviceName?: string
  latestMessage?: string
}) {
  const { form, mapPoint } = input
  const serviceCatalog = (input.services ?? [])
    .filter((service) => service.isActive !== false)
    .map(
      (service) =>
        `- ${service.id} | ${service.name} | ${service.description || ''}`,
    )
  return [
    'Thông tin vị trí/phạm vi từ Step 1:',
    `- Địa chỉ/khu vực: ${form.address || 'chưa nhập'}.`,
    `- Latitude: ${form.latitude || 'chưa nhập'}.`,
    `- Longitude: ${form.longitude || 'chưa nhập'}.`,
    `- Bán kính giám sát: ${form.radiusM}m.`,
    `- Diện tích ước tính: ${calcArea(form.radiusM)} ha.`,
    `- Điểm chọn trên bản đồ mô phỏng: x=${mapPoint.x.toFixed(1)}%, y=${mapPoint.y.toFixed(1)}%.`,
    `- Vùng map nhận diện: ${form.address || 'chưa xác định zone'}.`,
    '- Khách đã chấm vùng này ở Step 1; không hỏi lại vị trí/khu vực nếu không cần làm rõ mục tiêu chuyên môn.',
    '',
    'Thông tin request hiện tại:',
    `- Tin nhắn mới nhất của khách: ${input.latestMessage || 'chưa nhập'}.`,
    `- Tiêu đề: ${form.title || 'chưa nhập'}.`,
    `- Mô tả đang có: ${form.description || 'chưa nhập'}.`,
    `- Service customer đang chọn: ${input.serviceName || 'chưa chọn'}.`,
    '- Khung giờ, loại kết quả và media do biểu mẫu bên ngoài quản lý; AI không hỏi lại các thông tin này.',
    '',
    'Danh sách service active từ BE:',
    serviceCatalog.length ? serviceCatalog.join('\n') : '- chưa tải được catalog',
  ].join('\n')
}
