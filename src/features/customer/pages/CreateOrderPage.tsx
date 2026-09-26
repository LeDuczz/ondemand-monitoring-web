import { useEffect, useMemo, useRef, useState } from 'react'

import { env } from '../../../config/env'
import { ApiError } from '../../../shared/api/httpClient'
import {
  SIMULATION_MAP_DEFAULT_CROP,
  simulationMapAspectRatio,
  simulationMapImageStyle,
  viewportPercentToWorld,
  worldToViewportPercent,
} from '../../../shared/lib/simulationMapProjection'
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
const SIMULATION_MAP_TOP_IMAGE = '/simulation-viewer/simulation_map_top.png'

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

type StoredCreateOrderDraft = {
  step?: Step
  form?: FormState
  mapPoint?: MapPoint
  consultation?: CustomerConsultation | null
  chatMessages?: ConsultationMessage[]
  autoDraft?: {
    title: string
    description: string
  }
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
const RESTRICTED_ZONE_CONTACT_TOLERANCE_PX = 8
const MAP_IMAGE_CROP = SIMULATION_MAP_DEFAULT_CROP
const CREATE_ORDER_DRAFT_STORAGE_KEY = 'odm.customer.createOrderDraft.v1'
const OUTSIDE_MONITORING_ZONE_LABEL = 'Outside configured monitoring zones'

function isReusableConsultation(consultation?: CustomerConsultation | null) {
  if (!consultation?.id) return false
  if (consultation.id.startsWith('local-')) return false
  if (consultation.orderId) return false
  return consultation.status !== 'CONFIRMED' && consultation.status !== 'CANCELLED'
}

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

function createDefaultForm(): FormState {
  return {
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
  }
}

function isStep(value: unknown): value is Step {
  return value === 1 || value === 2 || value === 3 || value === 4
}

function readStoredCreateOrderDraft(): StoredCreateOrderDraft | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.localStorage.getItem(CREATE_ORDER_DRAFT_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as StoredCreateOrderDraft
  } catch {
    return null
  }
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
  const effectiveRadius = Math.max(0, radius - RESTRICTED_ZONE_CONTACT_TOLERANCE_PX)
  if (polygonContainsPoint(ring, center)) return true
  if (ring.some((point) => distanceBetweenPoints(center, point) <= effectiveRadius)) return true

  for (let index = 0; index < ring.length - 1; index += 1) {
    if (distancePointToSegment(center, ring[index], ring[index + 1]) <= effectiveRadius) {
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

function validateMonitoringZone(
  center: [number, number],
  zones: SimulationZone[],
) {
  const monitoringZones = zones.filter((zone) => !zone.restricted)
  if (monitoringZones.length === 0) {
    return {
      valid: true,
      zone: undefined as SimulationZone | undefined,
      checked: false,
    }
  }

  const zone = monitoringZones.find((item) => polygonContainsPoint(item.coordinates, center))
  return {
    valid: Boolean(zone),
    zone,
    checked: true,
  }
}

function simPointToPercent(point: [number, number], meta: SimulationMapMeta) {
  return worldToViewportPercent({ simX: point[0], simY: point[1] }, meta, MAP_IMAGE_CROP)
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

function truncateText(value: string, maxLength: number) {
  const trimmed = value.trim()
  if (trimmed.length <= maxLength) return trimmed
  return `${trimmed.slice(0, Math.max(0, maxLength - 3)).trim()}...`
}

export function buildDraftFromConsultation(
  _consultation: CustomerConsultation,
  _messages: ConsultationMessage[],
  _service?: ServiceOption,
) {
  return {
    title: '',
    description: '',
  }
}

function consultationStatusLabel(status?: string) {
  switch (status) {
    case 'ACTIVE':
      return 'Đang tư vấn'
    case 'READY_FOR_CONFIRMATION':
      return 'Sẵn sàng xác nhận'
    case 'COMPLETED':
      return 'Đã hoàn tất'
    case 'CONFIRMED':
      return 'Đã xác nhận'
    case 'CANCELLED':
      return 'Đã huỷ'
    default:
      return status ? 'Đang cập nhật' : 'Chưa bắt đầu'
  }
}

function wait(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

export function CreateOrderPage() {
  const { meta: mapMeta, error: mapError } = useSimulationMapMeta()
  const zones = useSimulationZones()
  const storedDraft = useMemo(() => readStoredCreateOrderDraft(), [])
  const [step, setStep] = useState<Step>(isStep(storedDraft?.step) ? storedDraft.step : 1)
  const [form, setForm] = useState<FormState>(() => ({
    ...createDefaultForm(),
    ...(storedDraft?.form ?? {}),
  }))
  const [services, setServices] = useState<ServiceOption[]>([])
  const [preferredTimes, setPreferredTimes] = useState<PreferredTimeOption[]>([])
  const [deliverables, setDeliverables] = useState<ServiceDeliverableOption[]>([])
  const [loadingMeta, setLoadingMeta] = useState(true)
  const [metaError, setMetaError] = useState<string | null>(null)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [mapPoint, setMapPoint] = useState<MapPoint>(storedDraft?.mapPoint ?? { x: 50, y: 50 })
  const initialConsultation = isReusableConsultation(storedDraft?.consultation)
    ? storedDraft?.consultation ?? null
    : null
  const [consultation, setConsultation] = useState<CustomerConsultation | null>(initialConsultation)
  const [chatMessages, setChatMessages] = useState<ConsultationMessage[]>(
    initialConsultation ? storedDraft?.chatMessages ?? [] : [],
  )
  const [chatText, setChatText] = useState('')
  const [chatBusy, setChatBusy] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [createdId, setCreatedId] = useState<string | null>(null)
  const [autoDraft, setAutoDraft] = useState(storedDraft?.autoDraft ?? { title: '', description: '' })

  const selectedService = services.find((service) => service.id === form.serviceId)
  const selectedTime = preferredTimes.find((time) => time.id === form.preferredTimeId)
  const selectedDeliverable = deliverables.find((item) => item.deliverableTypeId === form.deliverableTypeId)
  const score = useMemo(() => scoreRequest(form), [form])
  const mapImageUrl = `${env.apiBaseUrl}${SIMULATION_MAP_TOP_IMAGE}${
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
  const monitoringValidation = useMemo(
    () => validateMonitoringZone(selectedSimPoint, zones),
    [selectedSimPoint, zones],
  )

  useEffect(() => {
    const draft: StoredCreateOrderDraft = {
      step,
      form,
      mapPoint,
      consultation,
      chatMessages,
      autoDraft,
    }
    window.localStorage.setItem(CREATE_ORDER_DRAFT_STORAGE_KEY, JSON.stringify(draft))
  }, [autoDraft, chatMessages, consultation, form, mapPoint, step])

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
    const nextMessages = nextConsultation.messages?.length ? nextConsultation.messages : chatMessages
    const recommendedService = findRecommendedService(nextConsultation, services)
    const draft = buildDraftFromConsultation(nextConsultation, nextMessages, recommendedService)

    setForm((current) => ({
      ...current,
      title:
        !current.title.trim()
        || current.title === autoDraft.title
          ? draft.title || current.title
          : current.title,
      description:
        !current.description.trim()
        || current.description === autoDraft.description
          ? draft.description || current.description
          : current.description,
    }))
    setAutoDraft(draft)
    setErrors((current) => ({
      ...current,
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
    try {
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
    } catch (error) {
      if (
        error instanceof ApiError &&
        (error.status === 404 || error.message.toLowerCase().includes('consultation not found'))
      ) {
        setConsultation(null)
        setChatMessages([])
        window.localStorage.removeItem(CREATE_ORDER_DRAFT_STORAGE_KEY)
      }
      throw error
    }
    return false
  }

  function buildConsultationRequestContext(latestMessage = '') {
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
      `- Tin nhắn mới nhất của khách: ${latestMessage || 'chưa nhập'}.`,
      `- Tiêu đề: ${form.title || 'chưa nhập'}.`,
      `- Mô tả đang có: ${form.description || 'chưa nhập'}.`,
      `- Service customer đang chọn: ${selectedService?.name || 'chưa chọn'}.`,
      '- Khung giờ, loại kết quả và media do biểu mẫu bên ngoài quản lý; AI không hỏi lại các thông tin này.',
    ].join('\n')
  }

  function handleMapClick(event: React.MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    const mapX = clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100)
    const mapY = clamp(((event.clientY - rect.top) / rect.height) * 100, 0, 100)
    setMapPoint({ x: mapX, y: mapY })

    if (mapMeta) {
      const { simX, simY } = viewportPercentToWorld({ x: mapX, y: mapY }, mapMeta, MAP_IMAGE_CROP)
      update('latitude', simY.toFixed(3))
      update('longitude', simX.toFixed(3))
      const zone = findContainingZone([simX, simY], zones)
      update('address', zone?.name ?? OUTSIDE_MONITORING_ZONE_LABEL)
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
      if (!monitoringValidation.valid) {
        nextErrors.address = 'Vị trí này nằm ngoài các vùng giám sát đã cấu hình. Vui lòng chọn lại điểm trong vùng phục vụ.'
      }
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
    try {
      const session = await withConsultationTimeout((signal) =>
        customerApi.startConsultation(signal),
      )
      setConsultation(session)
      setChatMessages(session.messages ?? [])
      setSubmitError(null)
    } catch (error) {
      console.error('Start AI consultation failed', error)
      const message = `Không tạo được phiên tư vấn. ${describeChatError(error)}`
      appendChatNotice(message)
      setSubmitError(message)
    } finally {
      setChatBusy(false)
    }
  }

  useEffect(() => {
    if (step !== 2 || isReusableConsultation(consultation) || chatBusy) return
    void startConsultation()
  }, [step])

  async function sendChatMessage(messageOverride?: string) {
    const text = (messageOverride ?? chatText).trim()
    if (!text) return
    if (!authSession.getAccessToken()) {
      appendChatNotice('Bạn cần đăng nhập lại trước khi dùng AI tư vấn.')
      return
    }
    let activeConsultationId = isReusableConsultation(consultation) ? consultation?.id : undefined
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
    const requestContext = buildConsultationRequestContext(text)
    try {
      const currentConsultation = isReusableConsultation(consultation) ? consultation : null
      const session = currentConsultation ?? (await withConsultationTimeout((signal) =>
        customerApi.startConsultation(signal),
      ))
      if (!currentConsultation) setConsultation(session)
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

  function clearRequestConsultation() {
    setConsultation(null)
    setChatMessages([])
    setChatText('')
    setAutoDraft({ title: '', description: '' })
    setForm((current) => ({
      ...current,
      title: '',
      description: '',
    }))
    setErrors((current) => ({
      ...current,
      title: undefined,
    }))
    setSubmitError(null)
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
            consultationId: isReusableConsultation(consultation) ? consultation?.id : undefined,
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
      window.localStorage.removeItem(CREATE_ORDER_DRAFT_STORAGE_KEY)
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
          monitoringValidation={monitoringValidation}
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
          clearRequestConsultation={clearRequestConsultation}
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
  monitoringValidation,
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
  monitoringValidation: ReturnType<typeof validateMonitoringZone>
  restrictedValidation: ReturnType<typeof validateRestrictedZones>
  errors: Partial<Record<keyof FormState, string>>
  onMapClick: (event: React.MouseEvent<HTMLDivElement>) => void
  update: <K extends keyof FormState>(key: K, value: FormState[K]) => void
}) {
  const radiusPx = clamp(form.radiusM / SIM_RADIUS_SCALE, 34, 145)
  const restrictedZones = zones.filter((zone) => zone.restricted)
  const blockedZoneIds = new Set(restrictedValidation.blockedZones.map((zone) => zone.id))
  const isBlocked = !restrictedValidation.valid
  const isOutsideMonitoringZone = monitoringValidation.checked && !monitoringValidation.valid
  const hasLocationError = isBlocked || isOutsideMonitoringZone
  const statusTone = isOutsideMonitoringZone
    ? {
        border: '#f59e0b',
        background: '#fff7ed',
        color: '#9a3412',
        title: 'Ngoài vùng phục vụ',
        message: 'Điểm này chưa thuộc zone giám sát nào. Hãy bấm vào phần bản đồ nằm trong khu vực xanh để tạo request.',
      }
    : isBlocked
      ? {
          border: 'var(--red-fg)',
          background: 'var(--red-bg)',
          color: 'var(--red-fg)',
          title: 'Chạm vùng cấm bay',
          message: `Bán kính giám sát đang lấn vào vùng cấm ${restrictedValidation.blockedZones.map((zone) => zone.name).join(', ')}. Vui lòng chọn điểm khác hoặc giảm bán kính.`,
        }
      : {
          border: 'var(--green-dot)',
          background: 'var(--green-bg)',
          color: 'var(--green-fg)',
          title: 'Hợp lệ',
          message: `Nằm trong vùng giám sát${monitoringValidation.zone?.name ? ` ${monitoringValidation.zone.name}` : ''} và không chạm vùng cấm bay.`,
        }
  const imageStyle = simulationMapImageStyle(MAP_IMAGE_CROP)
  const layerStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 360px', gap: 16, alignItems: 'start' }}>
      <div
        role="button"
        tabIndex={0}
        onClick={onMapClick}
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: simulationMapAspectRatio(MAP_IMAGE_CROP),
          alignSelf: 'start',
          justifySelf: 'stretch',
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
              ...imageStyle,
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
        <div style={{ position: 'absolute', left: `${mapPoint.x}%`, top: `${mapPoint.y}%`, width: radiusPx * 2, height: radiusPx * 2, transform: 'translate(-50%, -50%)', borderRadius: '50%', border: `2px solid ${hasLocationError ? 'var(--red-fg)' : 'var(--blue-solid)'}`, background: hasLocationError ? 'rgba(220,38,38,.18)' : 'rgba(31,111,214,.16)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', left: `${mapPoint.x}%`, top: `${mapPoint.y}%`, width: 14, height: 14, transform: 'translate(-50%, -50%)', borderRadius: '50%', background: hasLocationError ? 'var(--red-fg)' : 'var(--blue-solid)', border: 0, boxShadow: hasLocationError ? '0 0 0 2px rgba(220,38,38,.24)' : '0 0 0 2px rgba(31,111,214,.24)', pointerEvents: 'none' }} />
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
              padding: 14,
              borderRadius: 8,
              border: `1px solid ${statusTone.border}`,
              background: statusTone.background,
              color: statusTone.color,
              fontSize: 13,
              lineHeight: 1.5,
              fontWeight: 700,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span
                aria-hidden="true"
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: statusTone.border,
                  boxShadow: `0 0 0 4px ${isOutsideMonitoringZone ? 'rgba(245,158,11,.16)' : hasLocationError ? 'rgba(220,38,38,.14)' : 'rgba(22,163,74,.14)'}`,
                }}
              />
              <strong style={{ fontSize: 14 }}>{statusTone.title}</strong>
            </div>
            <div style={{ fontWeight: 600 }}>{statusTone.message}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Metric label="Diện tích ước tính" value={`${calcArea(form.radiusM)} ha`} />
            <Metric label="Vùng giám sát" value={isOutsideMonitoringZone ? 'Ngoài vùng' : monitoringValidation.zone?.name ?? 'Đã kiểm tra'} />
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
  clearRequestConsultation,
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
  sendChatMessage: (messageOverride?: string) => void
  clearRequestConsultation: () => void
  update: <K extends keyof FormState>(key: K, value: FormState[K]) => void
}) {
  const recommendedService = findRecommendedService(consultation, services)
  const aiSuggestedServices = recommendedService ? [recommendedService] : []
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
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button type="button" className="odm-btn odm-btn-gh" onClick={clearRequestConsultation} disabled={chatBusy}>
                Xoá toàn bộ
              </button>
              <button type="button" className="odm-btn odm-btn-gh" onClick={startConsultation} disabled={chatBusy}>
                {consultation ? 'Tư vấn lại' : 'Nhờ AI tư vấn'}
              </button>
            </div>
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
                  AI đang phân tích nhu cầu...
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <textarea
                value={chatText}
                onChange={(event) => setChatText(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                    event.preventDefault()
                    sendChatMessage()
                  }
                }}
                placeholder="VD: Tôi có một khu đất trồng cà phê, cây phát triển không đồng đều..."
                rows={2}
                style={{ ...inputStyle, minHeight: 44, maxHeight: 96, paddingTop: 8, resize: 'vertical' }}
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
                    <div style={{ fontWeight: 800, color: 'var(--green-fg)' }}>AI đề xuất</div>
                    <div style={{ marginTop: 3, fontSize: 12, color: 'var(--green-fg)' }}>
                      Dựa trên nội dung chat và thông tin request hiện tại.
                    </div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 8, marginTop: 12 }}>
                  {aiSuggestedServices.map((service) => {
                    const active = form.serviceId === service.id
                    return (
                      <div
                        key={service.id}
                        style={{
                          textAlign: 'left',
                          minHeight: 78,
                          padding: 10,
                          borderRadius: 8,
                          border: `1.5px solid ${active ? 'var(--green-dot)' : 'rgba(22,163,74,.35)'}`,
                          background: active ? 'rgba(22,163,74,.16)' : 'var(--sf)',
                          color: 'var(--tx)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 8,
                        }}
                      >
                        <div style={{ fontWeight: 800, fontSize: 13, lineHeight: 1.25 }}>{service.name}</div>
                        <div style={{ marginTop: 6, color: 'var(--tx3)', fontSize: 11, lineHeight: 1.35 }}>
                          {service.description || 'Dịch vụ giám sát bằng drone.'}
                        </div>
                        <button type="button" className="odm-btn odm-btn-sm" onClick={() => update('serviceId', service.id)}>
                          {active ? 'Đã chọn' : 'Chọn dịch vụ này'}
                        </button>
                      </div>
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
          <div>
            <div style={{ color: 'var(--tx3)', fontSize: 12, fontWeight: 800, marginBottom: 6 }}>AI đã hiểu nhu cầu</div>
            <div style={{ border: '1px solid var(--bd)', borderRadius: 8, background: 'var(--sf2)', padding: 12, minHeight: 72, whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>
              {consultation?.requirementSummary || 'AI chưa có đủ thông tin để tóm tắt nhu cầu.'}
            </div>
          </div>
          <Metric label="AI đề xuất" value={recommendedService?.name || consultation?.recommendedServiceName || 'Chưa có đề xuất'} />
          <Metric label="Service đã chọn" value={selectedService?.name || 'Chưa chọn'} />
          <Metric label="Trạng thái tư vấn" value={consultationStatusLabel(consultation?.status)} />
          <Field label="Mô tả request">
            <textarea value={form.description} onChange={(event) => update('description', event.target.value)} placeholder="Mô tả bổ sung cho request nếu cần..." rows={5} style={{ ...inputStyle, height: 130, paddingTop: 8, resize: 'vertical' }} />
          </Field>
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
