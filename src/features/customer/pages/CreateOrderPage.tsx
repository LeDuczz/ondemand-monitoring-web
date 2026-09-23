import { useEffect, useMemo, useRef, useState } from 'react'

import { env } from '../../../config/env'
import { ApiError } from '../../../shared/api/httpClient'
import { authSession } from '../../auth/api/authApi'
import {
  customerApi,
  type CreateOrderPayload,
  type CustomerConsultation,
  type ConsultationMessage,
  type PreferredTimeOption,
  type ServiceDeliverableOption,
  type ServiceOption,
} from '../api/customerApi'
import { customerHref } from '../routes'

type Step = 1 | 2 | 3 | 4
type MapPoint = { x: number; y: number }
type AiScore = { score: number; level: 'good' | 'warn' | 'bad'; notes: string[] }

type SimulationMapMeta = {
  image?: string
  imageVersion?: string
  minX: number
  maxX: number
  minY: number
  maxY: number
  imageBounds?: {
    minX: number
    maxX: number
    minY: number
    maxY: number
  }
  width?: number
  height?: number
}

type ZonePayload = {
  id?: string
  code?: string
  name?: string
  zoneType?: string
  restricted?: boolean
  coordinates?: number[][]
}

type SimulationZone = {
  id: string
  code: string
  name: string
  zoneType: string
  restricted: boolean
  coordinates: [number, number][]
}

type FormState = {
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
}

const STEP_LABELS: Record<Step, string> = {
  1: 'Vị trí giám sát',
  2: 'AI tư vấn & mục tiêu',
  3: 'Thời gian và kết quả',
  4: 'Xác nhận & gửi yêu cầu',
}

const CONSULTATION_REQUEST_TIMEOUT_MS = 18_000
const ORDER_TITLE_MAX_LENGTH = 255
const SIM_RADIUS_SCALE = 6

const card: React.CSSProperties = {
  background: 'var(--sf)',
  border: '1px solid var(--bd)',
  borderRadius: 8,
}

const cardHead: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 16px',
  borderBottom: '1px solid var(--bd)',
  fontWeight: 700,
  fontSize: 13,
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: 36,
  border: '1px solid var(--bd2)',
  borderRadius: 6,
  padding: '0 10px',
  background: 'var(--sf)',
  color: 'var(--tx)',
}

function todayPlus(days: number) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function calcArea(radiusM: number) {
  return ((Math.PI * radiusM * radiusM) / 10000).toFixed(1)
}

function toNumber(value: string, fallback: number) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

async function withConsultationTimeout<T>(
  run: (signal: AbortSignal) => Promise<T>,
) {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => {
    controller.abort()
  }, CONSULTATION_REQUEST_TIMEOUT_MS)

  try {
    return await run(controller.signal)
  } finally {
    window.clearTimeout(timeoutId)
  }
}

function buildCoverageArea(longitude: number, latitude: number, radiusM: number) {
  const points = 24
  const latDelta = radiusM / 111_320
  const lonDelta = radiusM / (111_320 * Math.cos((latitude * Math.PI) / 180))
  const ring: number[][] = []

  for (let i = 0; i < points; i += 1) {
    const angle = (Math.PI * 2 * i) / points
    ring.push([
      Number((longitude + Math.cos(angle) * lonDelta).toFixed(7)),
      Number((latitude + Math.sin(angle) * latDelta).toFixed(7)),
    ])
  }
  ring.push(ring[0])

  return { type: 'Polygon' as const, coordinates: [ring] }
}

function formatTimeLabel(time: PreferredTimeOption) {
  const range = [time.startTime, time.endTime].filter(Boolean).join(' - ')
  return range ? `${time.name} (${range})` : time.name
}

function useSimulationMapMeta() {
  const [meta, setMeta] = useState<SimulationMapMeta | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true

    async function loadMeta() {
      try {
        const response = await fetch(
          `${env.apiBaseUrl}/simulation-viewer/simulation-map.json`,
          { cache: 'no-store' },
        )
        const payload = (await response.json()) as SimulationMapMeta
        if (alive) setMeta(payload)
      } catch {
        if (alive) setError('Không tải được map mô phỏng 3D.')
      }
    }

    void loadMeta()
    return () => {
      alive = false
    }
  }, [])

  return { meta, error }
}

function normalizeRing(coordinates: number[][] | undefined): [number, number][] {
  if (!coordinates) return []
  const ring = coordinates
    .map((point) => [Number(point[0]), Number(point[1])] as [number, number])
    .filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y))

  if (ring.length < 3) return []
  const first = ring[0]
  const last = ring[ring.length - 1]
  if (first[0] !== last[0] || first[1] !== last[1]) ring.push(first)
  return ring
}

function pointOnSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const cross = (px - ax) * (by - ay) - (py - ay) * (bx - ax)
  if (Math.abs(cross) > 1e-9) return false
  return (px - ax) * (px - bx) + (py - ay) * (py - by) <= 1e-9
}

function polygonContainsPoint(ring: [number, number][], point: [number, number]) {
  const [px, py] = point
  let inside = false

  for (let index = 0; index < ring.length - 1; index += 1) {
    const [ax, ay] = ring[index]
    const [bx, by] = ring[index + 1]
    if (pointOnSegment(px, py, ax, ay, bx, by)) return true
    if (ay > py !== by > py) {
      const xAtY = ax + ((py - ay) * (bx - ax)) / (by - ay)
      if (px < xAtY) inside = !inside
    }
  }

  return inside
}

function findContainingZone(point: [number, number], zones: SimulationZone[]) {
  return zones.find((zone) => polygonContainsPoint(zone.coordinates, point))
}

function distanceBetweenPoints(a: [number, number], b: [number, number]) {
  return Math.hypot(a[0] - b[0], a[1] - b[1])
}

function distancePointToSegment(
  point: [number, number],
  start: [number, number],
  end: [number, number],
) {
  const dx = end[0] - start[0]
  const dy = end[1] - start[1]
  if (dx === 0 && dy === 0) return distanceBetweenPoints(point, start)

  const t = clamp(
    ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / (dx * dx + dy * dy),
    0,
    1,
  )
  return distanceBetweenPoints(point, [start[0] + t * dx, start[1] + t * dy])
}

function circleIntersectsPolygon(
  center: [number, number],
  radius: number,
  ring: [number, number][],
) {
  if (polygonContainsPoint(ring, center)) return true
  if (ring.some((point) => distanceBetweenPoints(center, point) <= radius)) return true

  for (let index = 0; index < ring.length - 1; index += 1) {
    if (distancePointToSegment(center, ring[index], ring[index + 1]) <= radius) {
      return true
    }
  }

  return false
}

function validateRestrictedZones(
  center: [number, number],
  radiusM: number,
  zones: SimulationZone[],
) {
  const simulationRadius = radiusM / SIM_RADIUS_SCALE
  const restrictedZones = zones.filter((zone) => zone.restricted)
  const blockedZones = restrictedZones.filter((zone) =>
    circleIntersectsPolygon(center, simulationRadius, zone.coordinates),
  )

  return {
    valid: blockedZones.length === 0,
    blockedZones,
  }
}

function getMapBounds(meta: SimulationMapMeta) {
  return meta.imageBounds ?? meta
}

function simPointToPercent(point: [number, number], meta: SimulationMapMeta) {
  const bounds = getMapBounds(meta)

  return {
    x: ((point[0] - bounds.minX) / (bounds.maxX - bounds.minX)) * 100,
    y: ((bounds.maxY - point[1]) / (bounds.maxY - bounds.minY)) * 100,
  }
}

function useSimulationZones() {
  const [zones, setZones] = useState<SimulationZone[]>([])

  useEffect(() => {
    let alive = true

    async function loadZones() {
      try {
        const response = await fetch(`${env.apiBaseUrl}/api/zones`, {
          cache: 'no-store',
        })
        const payload = await response.json()
        const items = Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload)
            ? payload
            : []
        const normalized = (items as ZonePayload[])
          .map((zone) => ({
            id: String(zone.id ?? zone.code ?? zone.name ?? 'zone'),
            code: String(zone.code ?? ''),
            name: String(zone.name ?? zone.code ?? 'Monitoring zone'),
            zoneType: String(zone.zoneType ?? ''),
            restricted: Boolean(zone.restricted),
            coordinates: normalizeRing(zone.coordinates),
          }))
          .filter((zone) => zone.coordinates.length >= 4)
        if (alive) setZones(normalized)
      } catch {
        if (alive) setZones([])
      }
    }

    void loadZones()
    return () => {
      alive = false
    }
  }, [])

  return zones
}

function scoreRequest(form: FormState): AiScore {
  const notes: string[] = []
  let score = 92

  if (!form.address.trim()) {
    score -= 18
    notes.push('Thiếu địa chỉ mô tả khu vực giám sát.')
  }
  if (!form.serviceId) {
    score -= 20
    notes.push('Chưa chọn dịch vụ giám sát.')
  }
  if (!form.deliverableTypeId) {
    score -= 14
    notes.push('Chưa chọn kết quả bàn giao.')
  }
  if (!form.preferredDateFrom || !form.preferredDateTo || !form.preferredTimeId) {
    score -= 18
    notes.push('Thiếu ngày hoặc khung giờ bay.')
  }
  if (form.radiusM > 900) {
    score -= 12
    notes.push('Bán kính lớn, nên chia khu vực thành nhiều lượt bay.')
  }
  if (notes.length === 0) notes.push('Thông tin đủ để gửi yêu cầu cho bộ phận vận hành kiểm tra.')

  return {
    score: clamp(score, 0, 100),
    level: score >= 80 ? 'good' : score >= 55 ? 'warn' : 'bad',
    notes,
  }
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
}

function findRecommendedService(
  consultation: CustomerConsultation | null,
  services: ServiceOption[],
) {
  if (!consultation) return undefined

  if (consultation.recommendedServiceId) {
    const byId = services.find((service) => service.id === consultation.recommendedServiceId)
    if (byId) return byId
  }

  if (consultation.recommendedServiceName) {
    const recommendedName = normalizeText(consultation.recommendedServiceName)
    return services.find((service) => {
      const serviceName = normalizeText(service.name)
      return serviceName === recommendedName || serviceName.includes(recommendedName) || recommendedName.includes(serviceName)
    })
  }

  return undefined
}

function firstSentence(value: string) {
  return value
    .split(/[.!?\n]/)
    .map((item) => item.trim())
    .find(Boolean) ?? ''
}

function cleanRequirementText(value: string) {
  return value
    .replace(/^tôi muốn tạo yêu cầu giám sát:\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function truncateText(value: string, maxLength: number) {
  const trimmed = value.trim()
  if (trimmed.length <= maxLength) return trimmed
  return `${trimmed.slice(0, Math.max(0, maxLength - 3)).trim()}...`
}

function buildConsultationTitle(
  sourceText: string,
  service?: ServiceOption,
) {
  const normalized = normalizeText(sourceText)
  const object =
    normalized.includes('toa nha') || normalized.includes('cong trinh')
      ? 'công trình'
      : normalized.includes('kho bai') || normalized.includes('logistics') || normalized.includes('container')
        ? 'kho bãi/logistics'
        : normalized.includes('su kien') || normalized.includes('dong nguoi') || normalized.includes('dam dong')
          ? 'sự kiện/khu đông người'
          : normalized.includes('nha may') || normalized.includes('khu cong nghiep')
            ? 'nhà máy/khu công nghiệp'
      : normalized.includes('cay trong') || normalized.includes('nong nghiep') || normalized.includes('ca phe')
        ? 'cây trồng'
        : normalized.includes('moi truong') || normalized.includes('ngap') || normalized.includes('sat lo')
          ? 'môi trường'
          : normalized.includes('chay rung') || normalized.includes('diem nhiet')
            ? 'cháy rừng/điểm nhiệt'
            : normalized.includes('giao thong')
              ? 'giao thông'
                    : normalized.includes('duong ong') || normalized.includes('ro ri')
                      ? 'đường ống/hành lang tuyến'
                      : normalized.includes('cau') || normalized.includes('mat duong') || normalized.includes('sut lun')
                        ? 'cầu/đường'
                        : normalized.includes('tam pin') || normalized.includes('solar')
                ? 'tấm pin năng lượng mặt trời'
                : normalized.includes('duong day dien') || normalized.includes('tram bien ap')
                  ? 'đường dây điện/trạm biến áp'
                  : service?.name?.toLowerCase() || 'khu vực'

  const goals: string[] = []
  if (normalized.includes('nut vo') || normalized.includes('hu hong')) goals.push('nứt vỡ/hư hỏng')
  if (normalized.includes('diem nong') || normalized.includes('nhiet')) goals.push('điểm nóng')
  if (normalized.includes('an toan')) goals.push('an toàn')
  if (normalized.includes('tien do')) goals.push('tiến độ')
  if (normalized.includes('thieu nuoc')) goals.push('thiếu nước')
  if (normalized.includes('sau benh')) goals.push('sâu bệnh')
  if (normalized.includes('sinh truong')) goals.push('sinh trưởng bất thường')
  if (normalized.includes('ngap')) goals.push('ngập')
  if (normalized.includes('sat lo') || normalized.includes('xoi mon')) goals.push('sạt lở/xói mòn')
  if (normalized.includes('kiem ke')) goals.push('kiểm kê')
  if (normalized.includes('qua tai')) goals.push('quá tải')
  if (normalized.includes('dong nguoi') || normalized.includes('dam dong')) goals.push('mật độ đám đông')
  if (normalized.includes('ro ri')) goals.push('rò rỉ')
  if (normalized.includes('sut lun')) goals.push('sụt lún')
  if (normalized.includes('hanh lang an toan')) goals.push('hành lang an toàn')

  const uniqueGoals = [...new Set(goals)].slice(0, 2)
  const title = uniqueGoals.length
    ? `Giám sát ${object} phát hiện ${uniqueGoals.join(' và ')}`
    : `Giám sát ${object}`

  return truncateText(title, 96)
}

function buildDraftFromConsultation(
  consultation: CustomerConsultation,
  messages: ConsultationMessage[],
  service?: ServiceOption,
) {
  const customerMessages = messages
    .filter((message) => message.senderType === 'CUSTOMER')
    .map((message) => cleanRequirementText(message.message))
    .filter(Boolean)

  const assistantMessages = messages
    .filter((message) => message.senderType === 'ASSISTANT')
    .map((message) => message.message.trim())
    .filter(Boolean)

  const summarySource =
    consultation.requirementSummary ||
    firstSentence(assistantMessages.at(-1) ?? '') ||
    customerMessages.at(-1) ||
    ''

  const title = buildConsultationTitle(
    [
      summarySource,
      ...customerMessages,
      ...assistantMessages,
      service?.name ?? '',
    ].join('\n'),
    service,
  )

  const descriptionParts = [
    summarySource,
    service?.name ? `Dịch vụ AI đề xuất: ${service.name}.` : '',
  ].filter(Boolean)

  return {
    title,
    description: descriptionParts.join('\n\n'),
  }
}

function isChatAnswerTitle(
  title: string,
  messages: ConsultationMessage[],
) {
  const normalizedTitle = normalizeText(title.trim())
  if (!normalizedTitle) return true

  return messages
    .filter((message) => message.senderType === 'CUSTOMER')
    .map((message) => normalizeText(cleanRequirementText(message.message)))
    .some((message) => message === normalizedTitle)
}

function wait(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

function buildQuickReplies(messages: ConsultationMessage[]) {
  const lastAssistantMessage = [...messages]
    .reverse()
    .find((message) => message.senderType === 'ASSISTANT')
  const lastCustomerMessage = [...messages]
    .reverse()
    .find((message) => message.senderType === 'CUSTOMER')
  if (!lastAssistantMessage) {
    return [
      'Tôi muốn giám sát công trình.',
      'Tôi muốn theo dõi cây trồng bất thường.',
      'Tôi cần kiểm tra kho bãi/logistics.',
      'Tôi muốn giám sát sự kiện đông người.',
    ]
  }

  const text = normalizeText(lastAssistantMessage.message)
  const latestUserText = normalizeText(lastCustomerMessage?.message ?? '')
  if (latestUserText.includes('kho bai') || latestUserText.includes('logistics') || latestUserText.includes('container')) {
    return [
      'Tôi muốn kiểm kê container/xe/vật tư.',
      'Tôi muốn phát hiện khu vực quá tải.',
      'Tôi muốn theo dõi luồng ra vào.',
      'Tôi cần ảnh tổng quan và báo cáo bất thường.',
    ]
  }
  if (latestUserText.includes('nha may') || latestUserText.includes('khu cong nghiep')) {
    return [
      'Kiểm tra mái nhà và bồn chứa.',
      'Kiểm tra hàng rào và lối ra vào.',
      'Phát hiện điểm nóng/rò rỉ.',
      'Kiểm kê tài sản ngoài trời.',
    ]
  }
  if (latestUserText.includes('su kien') || latestUserText.includes('dong nguoi') || latestUserText.includes('dam dong')) {
    return [
      'Tôi muốn theo dõi mật độ đám đông.',
      'Tôi muốn phát hiện điểm ùn ứ.',
      'Tôi muốn giám sát bãi đỗ xe.',
      'Tôi cần cảnh báo theo thời gian thực.',
    ]
  }
  if (text.includes('nong nghiep') || text.includes('cay trong')) {
    return [
      'Tôi muốn phát hiện cây sinh trưởng kém.',
      'Tôi muốn tìm vùng thiếu nước.',
      'Tôi muốn phát hiện sâu bệnh.',
      'Tôi muốn theo dõi định kỳ để so sánh thay đổi.',
    ]
  }
  if (text.includes('moi truong') || text.includes('ngap') || text.includes('sat lo')) {
    return [
      'Tôi muốn theo dõi khu vực ngập.',
      'Tôi muốn phát hiện sạt lở/xói mòn.',
      'Tôi muốn kiểm tra ô nhiễm nguồn nước.',
      'Tôi cần bản đồ vùng rủi ro kèm tọa độ.',
    ]
  }
  if (text.includes('chay rung') || text.includes('diem nhiet')) {
    return [
      'Cảnh báo ngay khi phát hiện khói/điểm nhiệt.',
      'Tôi cần bản đồ nguy cơ cháy.',
      'Theo dõi định kỳ trong mùa khô.',
      'Thông báo qua email và SMS.',
    ]
  }
  if (text.includes('kho bai') || text.includes('logistics')) {
    return [
      'Tôi muốn kiểm kê container/xe/vật tư.',
      'Tôi muốn phát hiện khu vực quá tải.',
      'Tôi muốn theo dõi luồng ra vào.',
      'Tôi cần ảnh tổng quan và báo cáo bất thường.',
    ]
  }
  if (text.includes('su kien') || text.includes('dong nguoi') || text.includes('dam dong')) {
    return [
      'Tôi muốn theo dõi mật độ đám đông.',
      'Tôi muốn phát hiện điểm ùn ứ.',
      'Tôi muốn giám sát bãi đỗ xe.',
      'Tôi cần cảnh báo theo thời gian thực.',
    ]
  }
  if (text.includes('tam pin') || text.includes('nang luong mat troi')) {
    return [
      'Tôi muốn phát hiện điểm nóng.',
      'Tôi muốn tìm tấm lỗi/bụi bẩn.',
      'Tôi cần ảnh nhiệt theo từng dãy pin.',
      'Tôi muốn báo cáo tổng hợp hiệu suất.',
    ]
  }
  if (text.includes('duong day dien') || text.includes('tram bien ap')) {
    return [
      'Kiểm tra cột, sứ và dây dẫn.',
      'Phát hiện điểm nhiệt thiết bị.',
      'Kiểm tra hành lang an toàn.',
      'Báo cáo theo từng vị trí/cột.',
    ]
  }
  if (text.includes('ban do') || text.includes('2d') || text.includes('3d')) {
    return [
      'Tôi cần orthomosaic 2D.',
      'Tôi cần mô hình 3D/point cloud.',
      'Tôi muốn đo diện tích/thể tích.',
      'Tôi cần bản đồ hiện trạng chi tiết.',
    ]
  }
  if (text.includes('muc tieu') || text.includes('mục tiêu')) {
    return [
      'Kiểm tra nứt vỡ và hư hỏng.',
      'Phát hiện điểm nóng bất thường.',
      'Rà soát an toàn khu vực.',
      'Theo dõi tiến độ định kỳ.',
    ]
  }
  if (text.includes('khu vuc') || text.includes('ưu tiên') || text.includes('uu tien')) {
    return [
      'Ưu tiên mặt đứng và mặt tiền.',
      'Ưu tiên mái và khu kỹ thuật.',
      'Kiểm tra toàn bộ công trình.',
      'Chỉ kiểm tra khu vực có dấu hiệu bất thường.',
    ]
  }
  if (text.includes('ket qua') || text.includes('minh chung') || text.includes('bao cao')) {
    return [
      'Tôi muốn ảnh/video minh chứng.',
      'Tôi muốn báo cáo đánh dấu vị trí bất thường.',
      'Tôi muốn bản đồ khu vực có vấn đề.',
      'Tôi muốn cả báo cáo và ảnh minh chứng.',
    ]
  }
  if (text.includes('thong bao') || text.includes('email') || text.includes('sms')) {
    return [
      'Thông báo cho tôi qua email.',
      'Thông báo qua SMS/tin nhắn.',
      'Chỉ tổng hợp trong báo cáo sau chuyến bay.',
      'Cảnh báo ngay nếu có bất thường nghiêm trọng.',
    ]
  }
  if (text.includes('tan suat') || text.includes('định kỳ') || text.includes('dinh ky')) {
    return [
      'Tôi cần kiểm tra một lần.',
      'Tôi cần theo dõi hàng tuần.',
      'Tôi cần theo dõi hàng tháng.',
      'Tôi muốn so sánh thay đổi theo thời gian.',
    ]
  }

  return [
    'Tôi chưa chắc nguyên nhân, AI hỏi tiếp giúp tôi.',
    'Tôi muốn request đủ rõ để đội vận hành lập kế hoạch bay.',
    'Tôi muốn ưu tiên khu vực có dấu hiệu bất thường.',
    'Tôi muốn nhận báo cáo kèm ảnh minh chứng.',
  ]
}

export function CreateOrderPage() {
  const { meta: mapMeta, error: mapError } = useSimulationMapMeta()
  const zones = useSimulationZones()
  const [step, setStep] = useState<Step>(1)
  const [form, setForm] = useState<FormState>({
    title: '',
    description: '',
    address: '',
    latitude: '10.6402',
    longitude: '106.6912',
    radiusM: 300,
    serviceId: '',
    preferredDateFrom: todayPlus(1),
    preferredDateTo: todayPlus(1),
    preferredTimeId: '',
    deliverableTypeId: '',
    mediaType: 'IMAGE',
    quantity: 10,
    resolution: '4K',
  })
  const [services, setServices] = useState<ServiceOption[]>([])
  const [preferredTimes, setPreferredTimes] = useState<PreferredTimeOption[]>([])
  const [deliverables, setDeliverables] = useState<ServiceDeliverableOption[]>([])
  const [loadingMeta, setLoadingMeta] = useState(true)
  const [metaError, setMetaError] = useState<string | null>(null)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [mapPoint, setMapPoint] = useState<MapPoint>({ x: 50, y: 50 })
  const [consultation, setConsultation] = useState<CustomerConsultation | null>(null)
  const [chatMessages, setChatMessages] = useState<ConsultationMessage[]>([])
  const [chatText, setChatText] = useState('')
  const [chatBusy, setChatBusy] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [createdId, setCreatedId] = useState<string | null>(null)
  const [autoDraft, setAutoDraft] = useState({ title: '', description: '' })

  const selectedService = services.find((service) => service.id === form.serviceId)
  const selectedTime = preferredTimes.find((time) => time.id === form.preferredTimeId)
  const selectedDeliverable = deliverables.find((item) => item.deliverableTypeId === form.deliverableTypeId)
  const score = useMemo(() => scoreRequest(form), [form])
  const mapImageUrl = `${env.apiBaseUrl}${mapMeta?.image ?? '/simulation-viewer/simulation_map_top.png'}${
    mapMeta?.imageVersion ? `?v=${encodeURIComponent(mapMeta.imageVersion)}` : ''
  }`
  const selectedSimPoint = useMemo<[number, number]>(
    () => [toNumber(form.longitude, 0), toNumber(form.latitude, 0)],
    [form.longitude, form.latitude],
  )
  const restrictedValidation = useMemo(
    () => validateRestrictedZones(selectedSimPoint, form.radiusM, zones),
    [selectedSimPoint, form.radiusM, zones],
  )

  useEffect(() => {
    const controller = new AbortController()
    setLoadingMeta(true)
    setMetaError(null)

    Promise.all([
      customerApi.listServices(controller.signal),
      customerApi.listPreferredTimes(controller.signal),
    ])
      .then(([serviceItems, timeItems]) => {
        setServices(serviceItems)
        setPreferredTimes(timeItems)
        setForm((current) => ({
          ...current,
          preferredTimeId: current.preferredTimeId || timeItems[0]?.id || '',
        }))
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setMetaError(error instanceof Error ? error.message : 'Không tải được dữ liệu tạo yêu cầu.')
      })
      .finally(() => setLoadingMeta(false))

    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (!form.serviceId) {
      setDeliverables([])
      return
    }

    const controller = new AbortController()
    customerApi
      .listServiceDeliverables(form.serviceId, controller.signal)
      .then((items) => {
        setDeliverables(items)
        setForm((current) => {
          const valid = items.some((item) => item.deliverableTypeId === current.deliverableTypeId)
          return {
            ...current,
            deliverableTypeId: valid ? current.deliverableTypeId : items[0]?.deliverableTypeId || '',
          }
        })
      })
      .catch(() => setDeliverables([]))

    return () => controller.abort()
  }, [form.serviceId])

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: undefined }))
    setSubmitError(null)
  }

  function applyConsultationToRequest(nextConsultation: CustomerConsultation) {
    const nextService = findRecommendedService(nextConsultation, services)
    const nextMessages = nextConsultation.messages?.length ? nextConsultation.messages : chatMessages
    const draft = buildDraftFromConsultation(nextConsultation, nextMessages, nextService)

    setForm((current) => ({
      ...current,
      serviceId: nextService?.id ?? current.serviceId,
      title:
        !current.title.trim()
        || current.title === autoDraft.title
        || isChatAnswerTitle(current.title, nextMessages)
          ? draft.title || current.title
          : current.title,
      description:
        !current.description.trim() || current.description === autoDraft.description
          ? draft.description || current.description
          : current.description,
    }))
    setAutoDraft(draft)
    setErrors((current) => ({
      ...current,
      serviceId: nextService ? undefined : current.serviceId,
      title: draft.title ? undefined : current.title,
    }))
  }

  function receiveConsultation(nextConsultation: CustomerConsultation) {
    setConsultation(nextConsultation)
    if (nextConsultation.messages?.length) {
      setChatMessages(nextConsultation.messages)
    }
    applyConsultationToRequest(nextConsultation)
    setSubmitError(null)
  }

  function appendChatNotice(message: string) {
    setChatMessages((current) => [
      ...current,
      {
        id: `local-error-${Date.now()}`,
        senderType: 'ASSISTANT',
        message,
      },
    ])
  }

  function describeChatError(error: unknown) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return 'AI phản hồi quá lâu. Hệ thống đã dừng chờ để tránh treo màn hình, vui lòng gửi lại hoặc thử câu ngắn hơn.'
    }
    if (error instanceof ApiError) {
      const status = error.status ? ` · ${error.status}` : ''
      return `${error.message} (${error.method} ${error.path}${status})`
    }
    if (error instanceof Error && error.message) return error.message
    return 'Không nhận được phản hồi từ backend.'
  }

  async function recoverConsultationAfterSendFailure(consultationId: string) {
    for (let attempt = 0; attempt < 12; attempt += 1) {
      if (attempt > 0) await wait(1200)
      const latest = await customerApi.getConsultation(consultationId)
      const hasAssistantReply = latest.messages?.some(
        (message) => message.senderType === 'ASSISTANT',
      )
      if (hasAssistantReply) {
        receiveConsultation(latest)
        return true
      }
    }
    return false
  }

  function buildConsultationRequestContext() {
    return [
      'Thông tin vị trí/phạm vi từ Step 1:',
      `- Địa chỉ/khu vực: ${form.address || 'chưa nhập'}.`,
      `- Latitude: ${form.latitude || 'chưa nhập'}.`,
      `- Longitude: ${form.longitude || 'chưa nhập'}.`,
      `- Bán kính giám sát: ${form.radiusM}m.`,
      `- Diện tích ước tính: ${calcArea(form.radiusM)} ha.`,
      `- Điểm chọn trên bản đồ mô phỏng: x=${mapPoint.x.toFixed(1)}%, y=${mapPoint.y.toFixed(1)}%.`,
      `- Vùng map nhận diện: ${form.address || 'chưa xác định zone'}.`,
      '',
      'Thông tin request hiện tại:',
      `- Tiêu đề: ${form.title || 'chưa nhập'}.`,
      `- Mô tả đang có: ${form.description || 'chưa nhập'}.`,
      `- Service đang chọn: ${selectedService?.name || 'chưa chọn'}.`,
      `- Deliverable đang chọn: ${selectedDeliverable?.deliverableTypeName || 'chưa chọn'}.`,
      `- Thời gian dự kiến: ${form.preferredDateFrom || 'chưa chọn'} đến ${form.preferredDateTo || 'chưa chọn'}.`,
      `- Khung giờ: ${selectedTime ? formatTimeLabel(selectedTime) : 'chưa chọn'}.`,
      `- Media: ${form.mediaType}, số lượng ${form.quantity}, độ phân giải ${form.resolution}.`,
    ].join('\n')
  }

  function handleMapClick(event: React.MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    const mapX = clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100)
    const mapY = clamp(((event.clientY - rect.top) / rect.height) * 100, 0, 100)
    setMapPoint({ x: mapX, y: mapY })

    if (mapMeta) {
      const simX = mapMeta.minX + (mapX / 100) * (mapMeta.maxX - mapMeta.minX)
      const simY = mapMeta.maxY - (mapY / 100) * (mapMeta.maxY - mapMeta.minY)
      update('latitude', simY.toFixed(3))
      update('longitude', simX.toFixed(3))
      const zone = findContainingZone([simX, simY], zones)
      update('address', zone?.name ?? 'Outside configured monitoring zones')
      return
    }

    update('latitude', (10.6402 + (50 - mapY) * 0.00035).toFixed(6))
    update('longitude', (106.6912 + (mapX - 50) * 0.00042).toFixed(6))
  }

  function validateStep(targetStep: Step) {
    const nextErrors: Partial<Record<keyof FormState, string>> = {}

    if (targetStep >= 1) {
      if (!form.address.trim()) nextErrors.address = 'Nhập địa chỉ/khu vực cần giám sát.'
      if (!Number.isFinite(Number(form.latitude))) nextErrors.latitude = 'Latitude không hợp lệ.'
      if (!Number.isFinite(Number(form.longitude))) nextErrors.longitude = 'Longitude không hợp lệ.'
      if (!restrictedValidation.valid) {
        nextErrors.address = `Vùng giám sát chạm vùng cấm: ${restrictedValidation.blockedZones
          .map((zone) => zone.name)
          .join(', ')}. Vui lòng chọn điểm hoặc giảm bán kính.`
      }
    }
    if (targetStep >= 2) {
      if (!form.serviceId) nextErrors.serviceId = 'Chọn dịch vụ giám sát.'
      if (!form.title.trim()) nextErrors.title = 'Nhập tiêu đề yêu cầu.'
    }
    if (targetStep >= 3) {
      if (!form.preferredDateFrom) nextErrors.preferredDateFrom = 'Chọn ngày bắt đầu.'
      if (!form.preferredDateTo) nextErrors.preferredDateTo = 'Chọn ngày kết thúc.'
      if (form.preferredDateFrom && form.preferredDateTo && form.preferredDateFrom > form.preferredDateTo) {
        nextErrors.preferredDateTo = 'Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.'
      }
      if (!form.preferredTimeId) nextErrors.preferredTimeId = 'Chọn khung giờ.'
      if (!form.deliverableTypeId) nextErrors.deliverableTypeId = 'Chọn kết quả bàn giao.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function handleNext() {
    if (!validateStep(step)) return
    setStep((current) => Math.min(4, current + 1) as Step)
  }

  async function startConsultation() {
    if (!authSession.getAccessToken()) {
      appendChatNotice('Bạn cần đăng nhập lại trước khi dùng AI tư vấn.')
      return
    }
    setChatBusy(true)
    let startedConsultationId = ''
    const localMessage: ConsultationMessage = {
      id: `local-${Date.now()}`,
      senderType: 'CUSTOMER',
      message: '',
    }
    const seedMessage = [
      `Tôi muốn tạo yêu cầu giám sát: ${form.title || selectedService?.name || 'chưa đặt tiêu đề'}.`,
      `Địa điểm: ${form.address || 'chưa nhập'}.`,
      `Bán kính: ${form.radiusM}m.`,
      `Dịch vụ: ${selectedService?.name || 'chưa chọn'}.`,
      `Kết quả mong muốn: ${selectedDeliverable?.deliverableTypeName || form.mediaType}.`,
      'Bạn tư vấn giúp tôi cần bổ sung gì trước khi gửi request.',
    ].join(' ')
    localMessage.message = seedMessage
    const requestContext = buildConsultationRequestContext()
    setChatMessages([localMessage])
    try {
      const session = await withConsultationTimeout((signal) =>
        customerApi.startConsultation(signal),
      )
      startedConsultationId = session.id
      const nextConsultation = await withConsultationTimeout((signal) =>
        customerApi.sendConsultationMessage(session.id, seedMessage, {
          signal,
          requestContext,
        }),
      )
      receiveConsultation(nextConsultation)
    } catch (error) {
      console.error('Start AI consultation failed', error)
      const recovered = startedConsultationId
        ? await recoverConsultationAfterSendFailure(startedConsultationId).catch(() => false)
        : false
      if (!recovered) {
        const message = `Không lấy được phản hồi AI. ${describeChatError(error)}`
        appendChatNotice(message)
        setSubmitError(message)
      }
    } finally {
      setChatBusy(false)
    }
  }

  async function sendChatMessage() {
    const text = chatText.trim()
    if (!text) return
    if (!authSession.getAccessToken()) {
      appendChatNotice('Bạn cần đăng nhập lại trước khi dùng AI tư vấn.')
      return
    }
    let activeConsultationId = consultation?.id
    const localMessage: ConsultationMessage = {
      id: `local-${Date.now()}`,
      senderType: 'CUSTOMER',
      message: text,
    }
    setChatBusy(true)
    setChatText('')
    setChatMessages((current) => [
      ...current,
      localMessage,
    ])
    const requestContext = buildConsultationRequestContext()
    try {
      const session = consultation ?? (await withConsultationTimeout((signal) =>
        customerApi.startConsultation(signal),
      ))
      if (!consultation) setConsultation(session)
      activeConsultationId = session.id
      const nextConsultation = await withConsultationTimeout((signal) =>
        customerApi.sendConsultationMessage(session.id, text, {
          signal,
          requestContext,
        }),
      )
      receiveConsultation(nextConsultation)
    } catch (error) {
      console.error('Send AI consultation message failed', error)
      const recovered = activeConsultationId
        ? await recoverConsultationAfterSendFailure(activeConsultationId).catch(() => false)
        : false
      if (!recovered) {
        const message = `Không lấy được phản hồi AI. ${describeChatError(error)}`
        appendChatNotice(message)
        setSubmitError(message)
      }
    } finally {
      setChatBusy(false)
    }
  }

  function buildPayload(): CreateOrderPayload {
    const latitude = toNumber(form.latitude, 10.6402)
    const longitude = toNumber(form.longitude, 106.6912)
    return {
      title: truncateText(form.title, ORDER_TITLE_MAX_LENGTH),
      description: form.description.trim() || undefined,
      serviceId: form.serviceId,
      address: form.address.trim(),
      longitude,
      latitude,
      coverageArea: buildCoverageArea(longitude, latitude, form.radiusM),
      preferredDateFrom: form.preferredDateFrom,
      preferredDateTo: form.preferredDateTo,
      preferredTimeId: form.preferredTimeId,
      deliverables: [
        {
          deliverableTypeId: form.deliverableTypeId,
          requirement: {
            mediaType: form.mediaType,
            quantity: form.quantity,
            resolution: form.resolution,
            radiusM: form.radiusM,
            estimatedAreaHa: Number(calcArea(form.radiusM)),
            consultationId: consultation?.id,
            readinessScore: score.score,
          },
        },
      ],
    }
  }

  async function handleSubmit() {
    if (!validateStep(4)) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const result = await customerApi.createOrder(buildPayload())
      setCreatedId(result.id)
    } catch (error: unknown) {
      setSubmitError(error instanceof Error ? error.message : 'Không tạo được request.')
    } finally {
      setSubmitting(false)
    }
  }

  if (createdId) {
    return (
      <div style={{ maxWidth: 520, margin: '60px auto', textAlign: 'center' }}>
        <div style={{ width: 58, height: 58, borderRadius: '50%', background: 'var(--green-bg)', color: 'var(--green-fg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, margin: '0 auto 18px' }}>
          ✓
        </div>
        <h2 style={{ margin: 0, fontSize: 22 }}>Đã tạo request</h2>
        <p style={{ color: 'var(--tx3)', lineHeight: 1.6 }}>
          Yêu cầu đã được gửi qua API thật. Bộ phận vận hành có thể thấy trong hàng chờ để review và approve.
        </p>
        <a href={customerHref({ screen: 'orders' })} className="odm-btn odm-btn-p">
          Xem đơn của tôi
        </a>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22 }}>Tạo yêu cầu giám sát</h1>
          <div style={{ marginTop: 4, color: 'var(--tx3)', fontSize: 13 }}>
            Chọn vị trí trên bản đồ mô phỏng, nhập thông tin cần thiết, dùng AI tư vấn rồi gửi request.
          </div>
        </div>
        <a href={customerHref({ screen: 'orders' })} className="odm-btn odm-btn-gh">
          Huỷ
        </a>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', border: '1px solid var(--bd)', borderRadius: 8, overflow: 'hidden' }}>
        {([1, 2, 3, 4] as Step[]).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => item < step && setStep(item)}
            style={{
              minHeight: 48,
              border: 0,
              borderRight: item === 4 ? 0 : '1px solid var(--bd)',
              background: step === item ? 'var(--ink)' : item < step ? 'var(--sf2)' : 'var(--sf)',
              color: step === item ? 'var(--inkfg)' : 'var(--tx)',
              fontWeight: 700,
              textAlign: 'left',
              padding: '0 16px',
              cursor: item < step ? 'pointer' : 'default',
            }}
          >
            <span style={{ marginRight: 10, color: step === item ? 'inherit' : 'var(--tx3)' }}>{item}</span>
            {STEP_LABELS[item]}
          </button>
        ))}
      </div>

      {(metaError || mapError) && <Notice tone="error">{metaError || mapError}</Notice>}

      {step === 1 && (
        <StepLocation
          form={form}
          mapImageUrl={mapImageUrl}
          mapMeta={mapMeta}
          mapPoint={mapPoint}
          zones={zones}
          restrictedValidation={restrictedValidation}
          errors={errors}
          onMapClick={handleMapClick}
          update={update}
        />
      )}
      {step === 2 && (
        <StepService
          form={form}
          services={services}
          loadingMeta={loadingMeta}
          errors={errors}
          consultation={consultation}
          chatMessages={chatMessages}
          chatText={chatText}
          chatBusy={chatBusy}
          selectedService={selectedService}
          setChatText={setChatText}
          startConsultation={startConsultation}
          sendChatMessage={sendChatMessage}
          update={update}
        />
      )}
      {step === 3 && (
        <StepSchedule form={form} preferredTimes={preferredTimes} deliverables={deliverables} errors={errors} update={update} />
      )}
      {step === 4 && (
        <StepReview
          form={form}
          score={score}
          selectedService={selectedService}
          selectedTime={selectedTime}
          selectedDeliverable={selectedDeliverable}
          consultation={consultation}
        />
      )}

      {submitError && <Notice tone="error">{submitError}</Notice>}

      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        {step > 1 && (
          <button type="button" className="odm-btn odm-btn-gh" onClick={() => setStep((current) => (current - 1) as Step)}>
            Quay lại
          </button>
        )}
        <div style={{ flex: 1 }} />
        {step < 4 ? (
          <button type="button" className="odm-btn odm-btn-p" onClick={handleNext}>
            Tiếp tục: {STEP_LABELS[(step + 1) as Step]}
          </button>
        ) : (
          <button type="button" className="odm-btn odm-btn-p" onClick={handleSubmit} disabled={submitting || loadingMeta}>
            {submitting ? 'Đang gửi request...' : 'Gửi request'}
          </button>
        )}
      </div>
    </div>
  )
}

function StepLocation({
  form,
  mapImageUrl,
  mapMeta,
  mapPoint,
  zones,
  restrictedValidation,
  errors,
  onMapClick,
  update,
}: {
  form: FormState
  mapImageUrl: string
  mapMeta: SimulationMapMeta | null
  mapPoint: MapPoint
  zones: SimulationZone[]
  restrictedValidation: ReturnType<typeof validateRestrictedZones>
  errors: Partial<Record<keyof FormState, string>>
  onMapClick: (event: React.MouseEvent<HTMLDivElement>) => void
  update: <K extends keyof FormState>(key: K, value: FormState[K]) => void
}) {
  const radiusPx = clamp(form.radiusM / SIM_RADIUS_SCALE, 34, 145)
  const restrictedZones = zones.filter((zone) => zone.restricted)
  const blockedZoneIds = new Set(restrictedValidation.blockedZones.map((zone) => zone.id))
  const isBlocked = !restrictedValidation.valid
  const bounds = mapMeta ? getMapBounds(mapMeta) : null
  const activeLeft = mapMeta && bounds ? ((mapMeta.minX - bounds.minX) / (bounds.maxX - bounds.minX)) * 100 : 0
  const activeTop = mapMeta && bounds ? ((bounds.maxY - mapMeta.maxY) / (bounds.maxY - bounds.minY)) * 100 : 0
  const activeWidth = mapMeta && bounds ? ((mapMeta.maxX - mapMeta.minX) / (bounds.maxX - bounds.minX)) * 100 : 100
  const activeHeight = mapMeta && bounds ? ((mapMeta.maxY - mapMeta.minY) / (bounds.maxY - bounds.minY)) * 100 : 100
  const mapAspectRatio = mapMeta
    ? `${mapMeta.maxX - mapMeta.minX} / ${mapMeta.maxY - mapMeta.minY}`
    : '1 / 1'
  const layerStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${-(activeLeft / activeWidth) * 100}%`,
    top: `${-(activeTop / activeHeight) * 100}%`,
    width: `${(100 / activeWidth) * 100}%`,
    height: `${(100 / activeHeight) * 100}%`,
    pointerEvents: 'none',
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 360px', gap: 16 }}>
      <div
        role="button"
        tabIndex={0}
        onClick={onMapClick}
        style={{
          position: 'relative',
          aspectRatio: mapAspectRatio,
          minHeight: 0,
          overflow: 'hidden',
          cursor: 'crosshair',
          background: 'transparent',
          border: 0,
          borderRadius: 0,
          boxShadow: 'none',
          outline: 'none',
        }}
      >
        <div
          style={layerStyle}
        >
          <img
            alt="3D simulation map"
            src={mapImageUrl}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'fill',
              opacity: 0.96,
              userSelect: 'none',
              pointerEvents: 'none',
              border: 0,
              outline: 'none',
            }}
          />
          {mapMeta && restrictedZones.map((zone) => {
            const points = zone.coordinates
              .map((point) => simPointToPercent(point, mapMeta))
              .map((point) => `${point.x}% ${point.y}%`)
              .join(', ')
            const blocked = blockedZoneIds.has(zone.id)

            return (
              <div
                key={zone.id}
                title={zone.name}
                style={{
                  position: 'absolute',
                  inset: 0,
                  clipPath: `polygon(${points})`,
                  background: blocked ? 'rgba(220,38,38,.28)' : 'rgba(220,38,38,.14)',
                  border: 0,
                  pointerEvents: 'none',
                }}
              />
            )
          })}
        </div>
        <div style={{ position: 'absolute', left: `${mapPoint.x}%`, top: `${mapPoint.y}%`, width: radiusPx * 2, height: radiusPx * 2, transform: 'translate(-50%, -50%)', borderRadius: '50%', border: `2px solid ${isBlocked ? 'var(--red-fg)' : 'var(--blue-solid)'}`, background: isBlocked ? 'rgba(220,38,38,.18)' : 'rgba(31,111,214,.16)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', left: `${mapPoint.x}%`, top: `${mapPoint.y}%`, width: 14, height: 14, transform: 'translate(-50%, -50%)', borderRadius: '50%', background: isBlocked ? 'var(--red-fg)' : 'var(--blue-solid)', border: 0, boxShadow: isBlocked ? '0 0 0 2px rgba(220,38,38,.24)' : '0 0 0 2px rgba(31,111,214,.24)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', left: 12, bottom: 12, display: 'flex', gap: 8, alignItems: 'center', background: 'var(--sf)', border: '1px solid var(--bd)', borderRadius: 8, padding: '8px 10px', fontSize: 12 }}>
          <span style={{ width: 12, height: 12, borderRadius: 3, background: 'rgba(220,38,38,.22)', border: '1px solid var(--red-fg)' }} />
          Vùng cấm bay
        </div>
      </div>

      <div style={card}>
        <div style={cardHead}>Vị trí và bán kính</div>
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Địa chỉ/khu vực" error={errors.address}>
            <textarea value={form.address} onChange={(event) => update('address', event.target.value)} placeholder="VD: KCN Long Hậu, Cần Giuộc, Long An" rows={4} style={{ ...inputStyle, height: 92, paddingTop: 8, resize: 'vertical' }} />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Sim Y / Latitude" error={errors.latitude}>
              <input value={form.latitude} onChange={(event) => update('latitude', event.target.value)} style={inputStyle} />
            </Field>
            <Field label="Sim X / Longitude" error={errors.longitude}>
              <input value={form.longitude} onChange={(event) => update('longitude', event.target.value)} style={inputStyle} />
            </Field>
          </div>
          <Field label={`Bán kính giám sát: ${form.radiusM} m`}>
            <input type="range" min={100} max={1500} step={50} value={form.radiusM} onChange={(event) => update('radiusM', Number(event.target.value))} style={{ width: '100%' }} />
          </Field>
          <div
            style={{
              padding: 12,
              borderRadius: 8,
              border: `1px solid ${isBlocked ? 'var(--red-fg)' : 'var(--green-dot)'}`,
              background: isBlocked ? 'var(--red-bg)' : 'var(--green-bg)',
              color: isBlocked ? 'var(--red-fg)' : 'var(--green-fg)',
              fontSize: 12,
              lineHeight: 1.5,
              fontWeight: 700,
            }}
          >
            {isBlocked
              ? `Không hợp lệ: vùng giám sát chạm vùng cấm ${restrictedValidation.blockedZones.map((zone) => zone.name).join(', ')}.`
              : 'Hợp lệ: không chạm vùng cấm bay.'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Metric label="Diện tích ước tính" value={`${calcArea(form.radiusM)} ha`} />
            <Metric label="Vùng cấm" value={isBlocked ? 'Không hợp lệ' : 'Đã kiểm tra'} />
          </div>
        </div>
      </div>
    </div>
  )
}

function StepService({
  form,
  services,
  loadingMeta,
  errors,
  consultation,
  chatMessages,
  chatText,
  chatBusy,
  selectedService,
  setChatText,
  startConsultation,
  sendChatMessage,
  update,
}: {
  form: FormState
  services: ServiceOption[]
  loadingMeta: boolean
  errors: Partial<Record<keyof FormState, string>>
  consultation: CustomerConsultation | null
  chatMessages: ConsultationMessage[]
  chatText: string
  chatBusy: boolean
  selectedService?: ServiceOption
  setChatText: (value: string) => void
  startConsultation: () => void
  sendChatMessage: () => void
  update: <K extends keyof FormState>(key: K, value: FormState[K]) => void
}) {
  const recommendedService = findRecommendedService(consultation, services)
  const aiSuggestedServices = recommendedService ? [recommendedService] : []
  const quickReplies = buildQuickReplies(chatMessages)
  const chatScrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    chatScrollRef.current?.scrollTo({
      top: chatScrollRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [chatMessages, chatBusy])

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 360px', gap: 16 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={card}>
          <div style={cardHead}>
            AI tư vấn nhu cầu
            <button type="button" className="odm-btn odm-btn-gh" onClick={startConsultation} disabled={chatBusy}>
              {consultation ? 'Tư vấn lại' : 'Nhờ AI tư vấn'}
            </button>
          </div>
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div
              ref={chatScrollRef}
              style={{
                minHeight: 250,
                maxHeight: 320,
                overflow: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                paddingRight: 4,
              }}
            >
              {chatMessages.length === 0 && (
                <div style={{ color: 'var(--tx3)', fontSize: 13, lineHeight: 1.6 }}>
                  AI sẽ hỏi nhu cầu giám sát, mục tiêu, rủi ro cần phát hiện và đề xuất service phù hợp. Location đã lấy từ Step 1; AI không tự quyết lịch bay.
                </div>
              )}
              {chatMessages.map((message) => {
                const mine = message.senderType === 'CUSTOMER'
                return (
                  <div
                    key={message.id}
                    style={{
                      alignSelf: mine ? 'flex-end' : 'flex-start',
                      maxWidth: '86%',
                      padding: '9px 11px',
                      borderRadius: 8,
                      background: mine ? 'var(--ink)' : 'var(--sf2)',
                      color: mine ? 'var(--inkfg)' : 'var(--tx)',
                      fontSize: 13,
                      lineHeight: 1.5,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 800, opacity: 0.7, marginBottom: 3 }}>
                      {mine ? 'Bạn' : 'AI tư vấn'}
                    </div>
                    <div>{message.message}</div>
                  </div>
                )
              })}
              {chatBusy && (
                <div style={{ alignSelf: 'flex-start', maxWidth: '86%', padding: '9px 11px', borderRadius: 8, background: 'var(--sf2)', color: 'var(--tx3)', fontSize: 13, lineHeight: 1.5 }}>
                  AI đang trả lời...
                </div>
              )}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {quickReplies.map((reply) => (
                <button
                  key={reply}
                  type="button"
                  onClick={() => setChatText(reply)}
                  disabled={chatBusy}
                  style={{
                    border: '1px solid var(--bd)',
                    background: 'var(--sf2)',
                    color: 'var(--tx2)',
                    borderRadius: 8,
                    padding: '7px 10px',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: chatBusy ? 'not-allowed' : 'pointer',
                  }}
                >
                  {reply}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={chatText}
                onChange={(event) => setChatText(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
                    event.preventDefault()
                    sendChatMessage()
                  }
                }}
                placeholder="VD: Tôi trồng cà phê và muốn phát hiện cây bất thường..."
                style={inputStyle}
              />
              <button type="button" className="odm-btn odm-btn-p" onClick={() => sendChatMessage()} disabled={chatBusy || !chatText.trim()}>
                Gửi
              </button>
            </div>
          </div>
        </div>

        <div style={card}>
          <div style={cardHead}>Đề xuất từ AI hoặc tự chọn dịch vụ</div>
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {aiSuggestedServices.length > 0 && (
              <div style={{ border: '1.5px solid var(--green-dot)', background: 'var(--green-bg)', borderRadius: 8, padding: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <div>
                    <div style={{ fontWeight: 800, color: 'var(--green-fg)' }}>AI gợi ý service phù hợp</div>
                    <div style={{ marginTop: 3, fontSize: 12, color: 'var(--green-fg)' }}>
                      Dựa trên nội dung chat và thông tin request hiện tại.
                    </div>
                  </div>
                  {recommendedService && (
                    <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--green-fg)' }}>Recommended</span>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 8, marginTop: 12 }}>
                  {aiSuggestedServices.map((service) => {
                    const active = form.serviceId === service.id
                    return (
                      <button
                        key={service.id}
                        type="button"
                        onClick={() => update('serviceId', service.id)}
                        style={{
                          textAlign: 'left',
                          minHeight: 78,
                          padding: 10,
                          borderRadius: 8,
                          border: `1.5px solid ${active ? 'var(--green-dot)' : 'rgba(22,163,74,.35)'}`,
                          background: active ? 'rgba(22,163,74,.16)' : 'var(--sf)',
                          color: 'var(--tx)',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ fontWeight: 800, fontSize: 13, lineHeight: 1.25 }}>{service.name}</div>
                        <div style={{ marginTop: 6, color: 'var(--tx3)', fontSize: 11, lineHeight: 1.35 }}>
                          {service.description || 'Dịch vụ giám sát bằng drone.'}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <div style={{ fontWeight: 700, fontSize: 13 }}>Tất cả service active</div>
              <div style={{ color: 'var(--tx3)', fontSize: 12 }}>{services.length} service</div>
            </div>
            <div style={{ maxHeight: 360, overflow: 'auto', paddingRight: 4 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 12 }}>
              {loadingMeta && <div style={{ color: 'var(--tx3)' }}>Đang tải dịch vụ...</div>}
              {!loadingMeta && services.length === 0 && <div style={{ color: 'var(--red-fg)' }}>Chưa có service active trong backend.</div>}
              {services.map((service) => {
                const active = form.serviceId === service.id
                const suggested = aiSuggestedServices.some((item) => item.id === service.id)
                return (
                  <button key={service.id} type="button" onClick={() => update('serviceId', service.id)} style={{ textAlign: 'left', padding: 14, borderRadius: 8, border: `1.5px solid ${active ? 'var(--blue-solid)' : 'var(--bd)'}`, background: active ? 'var(--blue-bg)' : 'var(--sf)', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ fontWeight: 800, color: active ? 'var(--blue-fg)' : 'var(--tx)' }}>{service.name}</div>
                      {suggested && <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--green-fg)' }}>AI</span>}
                    </div>
                    <div style={{ marginTop: 8, color: 'var(--tx3)', fontSize: 12, lineHeight: 1.5 }}>{service.description || 'Dịch vụ giám sát bằng drone.'}</div>
                  </button>
                )
              })}
              </div>
            </div>
            {errors.serviceId && <div style={{ color: 'var(--red-fg)', fontSize: 12 }}>{errors.serviceId}</div>}
          </div>
        </div>
      </div>

      <div style={card}>
        <div style={cardHead}>Thông tin request</div>
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Tiêu đề" error={errors.title}>
            <input value={form.title} onChange={(event) => update('title', event.target.value)} placeholder="VD: Giám sát tiến độ khu công trình phía Đông" style={inputStyle} />
          </Field>
          <Field label="Mô tả yêu cầu">
            <textarea value={form.description} onChange={(event) => update('description', event.target.value)} placeholder="Mô tả mục tiêu, khu vực cần chú ý, ràng buộc an toàn..." rows={8} style={{ ...inputStyle, height: 180, paddingTop: 8, resize: 'vertical' }} />
          </Field>
          <Metric label="Service đã chọn" value={selectedService?.name || 'Chưa chọn'} />
          {consultation?.status && <Metric label="Trạng thái tư vấn" value={consultation.status} />}
        </div>
      </div>
    </div>
  )
}

function StepSchedule({
  form,
  preferredTimes,
  deliverables,
  errors,
  update,
}: {
  form: FormState
  preferredTimes: PreferredTimeOption[]
  deliverables: ServiceDeliverableOption[]
  errors: Partial<Record<keyof FormState, string>>
  update: <K extends keyof FormState>(key: K, value: FormState[K]) => void
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 360px', gap: 16 }}>
      <div style={card}>
        <div style={cardHead}>Thời gian bay</div>
        <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label="Ngày bắt đầu" error={errors.preferredDateFrom}>
            <input type="date" value={form.preferredDateFrom} onChange={(event) => update('preferredDateFrom', event.target.value)} style={inputStyle} />
          </Field>
          <Field label="Ngày kết thúc" error={errors.preferredDateTo}>
            <input type="date" value={form.preferredDateTo} onChange={(event) => update('preferredDateTo', event.target.value)} style={inputStyle} />
          </Field>
          <div style={{ gridColumn: '1 / -1' }}>
            <Field label="Khung giờ" error={errors.preferredTimeId}>
              <select value={form.preferredTimeId} onChange={(event) => update('preferredTimeId', event.target.value)} style={inputStyle}>
                <option value="">Chọn khung giờ</option>
                {preferredTimes.map((time) => <option key={time.id} value={time.id}>{formatTimeLabel(time)}</option>)}
              </select>
            </Field>
          </div>
        </div>
      </div>

      <div style={card}>
        <div style={cardHead}>Kết quả bàn giao</div>
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Deliverable type" error={errors.deliverableTypeId}>
            <select value={form.deliverableTypeId} onChange={(event) => update('deliverableTypeId', event.target.value)} style={inputStyle}>
              <option value="">Chọn kết quả</option>
              {deliverables.map((item) => <option key={item.id} value={item.deliverableTypeId}>{item.deliverableTypeName || item.deliverableTypeId}</option>)}
            </select>
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Media">
              <select value={form.mediaType} onChange={(event) => update('mediaType', event.target.value as FormState['mediaType'])} style={inputStyle}>
                <option value="IMAGE">Ảnh</option>
                <option value="VIDEO">Video</option>
              </select>
            </Field>
            <Field label="Số lượng">
              <input type="number" min={1} value={form.quantity} onChange={(event) => update('quantity', Number(event.target.value))} style={inputStyle} />
            </Field>
          </div>
          <Field label="Độ phân giải">
            <select value={form.resolution} onChange={(event) => update('resolution', event.target.value)} style={inputStyle}>
              <option value="1080p">1080p</option>
              <option value="4K">4K</option>
              <option value="20MP">20MP</option>
              <option value="640x512">640x512 Thermal</option>
            </select>
          </Field>
        </div>
      </div>
    </div>
  )
}

function StepReview(props: {
  form: FormState
  score: AiScore
  selectedService?: ServiceOption
  selectedTime?: PreferredTimeOption
  selectedDeliverable?: ServiceDeliverableOption
  consultation: CustomerConsultation | null
}) {
  const scoreColor = props.score.level === 'good' ? 'var(--green-fg)' : props.score.level === 'warn' ? 'var(--orange-fg)' : 'var(--red-fg)'

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 420px', gap: 16 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={card}>
          <div style={cardHead}>Xác nhận request</div>
          <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '170px 1fr', gap: '10px 14px', fontSize: 13 }}>
            <LabelValue label="Tiêu đề" value={props.form.title || '—'} />
            <LabelValue label="Địa chỉ" value={props.form.address || '—'} />
            <LabelValue label="Tọa độ" value={`${props.form.latitude}, ${props.form.longitude}`} mono />
            <LabelValue label="Bán kính" value={`${props.form.radiusM} m · ${calcArea(props.form.radiusM)} ha`} mono />
            <LabelValue label="Dịch vụ" value={props.selectedService?.name || '—'} />
            <LabelValue label="Ngày" value={`${props.form.preferredDateFrom} → ${props.form.preferredDateTo}`} mono />
            <LabelValue label="Khung giờ" value={props.selectedTime ? formatTimeLabel(props.selectedTime) : '—'} />
            <LabelValue label="Deliverable" value={props.selectedDeliverable?.deliverableTypeName || '—'} />
            <LabelValue label="AI consultation" value={props.consultation?.id ? 'Đã tư vấn' : 'Không dùng'} />
          </div>
        </div>

        <div style={card}>
          <div style={cardHead}>AI chấm điểm mô phỏng</div>
          <div style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 42, color: scoreColor }}>{props.score.score}</div>
              <div>
                <div style={{ fontWeight: 800 }}>Điểm sẵn sàng gửi request</div>
                <div style={{ color: 'var(--tx3)', fontSize: 13 }}>Điểm này giúp user kiểm tra thiếu thông tin trước khi call API tạo order.</div>
              </div>
            </div>
            <ul style={{ margin: '12px 0 0', paddingLeft: 18, color: 'var(--tx2)', lineHeight: 1.6 }}>
              {props.score.notes.map((note) => <li key={note}>{note}</li>)}
            </ul>
          </div>
        </div>
      </div>

      <div style={card}>
        <div style={cardHead}>Tóm tắt tư vấn AI</div>
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {props.consultation?.recommendedServiceName || props.consultation?.recommendedServiceId ? (
            <div style={{ padding: 12, borderRadius: 8, background: 'var(--green-bg)', color: 'var(--green-fg)', lineHeight: 1.5 }}>
              <div style={{ fontWeight: 800 }}>Service đề xuất</div>
              <div>{props.consultation.recommendedServiceName || props.selectedService?.name || props.consultation.recommendedServiceId}</div>
            </div>
          ) : (
            <div style={{ color: 'var(--tx3)', fontSize: 13, lineHeight: 1.6 }}>
              Customer tự chọn service hoặc chưa dùng AI tư vấn ở Step 2.
            </div>
          )}
          {props.consultation?.requirementSummary && (
            <div style={{ padding: 12, borderRadius: 8, background: 'var(--blue-bg)', color: 'var(--blue-fg)', fontSize: 13, lineHeight: 1.6 }}>
              {props.consultation.requirementSummary}
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Metric label="Media" value={`${props.form.mediaType} · ${props.form.resolution}`} />
            <Metric label="Số lượng" value={String(props.form.quantity)} />
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12, fontWeight: 700, color: 'var(--tx2)' }}>
      {label}
      {children}
      {error && <span style={{ color: 'var(--red-fg)', fontWeight: 600 }}>{error}</span>}
    </label>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: 'var(--sf2)', borderRadius: 8, padding: 12 }}>
      <div style={{ color: 'var(--tx3)', fontSize: 12 }}>{label}</div>
      <div style={{ marginTop: 4, fontWeight: 800 }}>{value}</div>
    </div>
  )
}

function LabelValue({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <>
      <span style={{ color: 'var(--tx3)' }}>{label}</span>
      <span style={{ fontWeight: 700, fontFamily: mono ? 'var(--font-mono)' : undefined }}>{value}</span>
    </>
  )
}

function Notice({ tone, children }: { tone: 'error'; children: React.ReactNode }) {
  return (
    <div style={{ ...card, padding: 12, color: tone === 'error' ? 'var(--red-fg)' : 'var(--tx)', background: tone === 'error' ? 'var(--red-bg)' : 'var(--sf)' }}>
      {children}
    </div>
  )
}
