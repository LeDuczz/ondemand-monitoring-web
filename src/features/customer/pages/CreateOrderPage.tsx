import { useState } from 'react'

import { customerApi, type CreateOrderPayload } from '../api/customerApi'
import { customerHref } from '../routes'

// ── Constants ─────────────────────────────────────────────

type Step = 1 | 2 | 3 | 4

const STEP_LABELS: Record<Step, string> = {
  1: 'Vị trí giám sát',
  2: 'Dịch vụ và mục đích',
  3: 'Thời gian',
  4: 'Xem lại',
}

const RADIUS_OPTIONS = [100, 200, 300, 400, 500, 600, 700, 800, 1000, 1200, 1500] as const

type ServiceDef = {
  id: string
  label: string
  description: string
  sensors: string[]
  durationMin: number
  heightRange: string
  icon: string
}

const SERVICES: ServiceDef[] = [
  {
    id: 'svc-construction',
    label: 'Giám sát tiến độ công trình',
    description: 'Ghi hình định kỳ để đối chiếu tiến độ thi công theo từng mốc.',
    sensors: ['RGB'],
    durationMin: 40,
    heightRange: '30–120 m',
    icon: '🏗️',
  },
  {
    id: 'svc-thermal',
    label: 'Kiểm tra nhiệt mái và tấm pin',
    description: 'Phát hiện điểm nóng bất thường trên mái nhà xưởng, tủ điện, tấm pin.',
    sensors: ['THERMAL'],
    durationMin: 35,
    heightRange: '20–100 m',
    icon: '🌡️',
  },
  {
    id: 'svc-security',
    label: 'Tuần tra an ninh khu vực',
    description: 'Bay tuần tra theo vòng bán kính, ghi hình và phát trực tiếp.',
    sensors: ['RGB', 'ZOOM (tuỳ chọn)'],
    durationMin: 30,
    heightRange: '40–120 m',
    icon: '🛡️',
  },
  {
    id: 'svc-ndvi',
    label: 'Giám sát cây trồng (NDVI)',
    description: 'Đánh giá sức khoẻ cây trồng bằng ảnh đa phổ.',
    sensors: ['MULTISPECTRAL'],
    durationMin: 45,
    heightRange: '30–120 m',
    icon: '🌾',
  },
  {
    id: 'svc-traffic',
    label: 'Giám sát giao thông và sự kiện',
    description: 'Quan sát lưu lượng phương tiện, mật độ đám đông theo thời gian thực.',
    sensors: ['RGB', 'ZOOM'],
    durationMin: 30,
    heightRange: '60–120 m',
    icon: '🚦',
  },
  {
    id: 'svc-mapping',
    label: 'Bản đồ 2D/3D (orthomosaic)',
    description: 'Bay lưới, xuất ảnh ghép và mô hình địa hình.',
    sensors: ['RGB'],
    durationMin: 50,
    heightRange: '60–120 m',
    icon: '🗺️',
  },
]

const TIME_SLOTS = [
  { id: 'MORNING', label: 'Buổi sáng', detail: '07:00–11:00' },
  { id: 'AFTERNOON', label: 'Buổi chiều', detail: '13:00–17:00' },
]

// ── Helper: mini calendar ─────────────────────────────────

function buildCalendar(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay() // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = []
  const startOffset = (firstDay + 6) % 7 // Monday-first
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  return cells
}

const MONTH_NAMES = [
  'Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6',
  'Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12',
]
const DAY_NAMES = ['T2','T3','T4','T5','T6','T7','CN']

// ── Helpers ───────────────────────────────────────────────

function calcArea(radiusM: number): string {
  const ha = (Math.PI * radiusM * radiusM) / 10000
  return ha < 1 ? `${(ha * 10000).toFixed(0)} m²` : `${ha.toFixed(1)} ha`
}

function fmtDateVi(iso: string): string {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

// ── Form state ────────────────────────────────────────────

type FormState = {
  addressText: string
  centerLat: string
  centerLon: string
  radiusM: number
  serviceIds: string[]
  title: string
  purpose: string
  description: string
  preferredDate: string
  preferredTimeId: string
}

// ── Component ─────────────────────────────────────────────

export function CreateOrderPage() {
  const today = new Date()
  const [step, setStep] = useState<Step>(1)
  const [form, setForm] = useState<FormState>({
    addressText: '',
    centerLat: '',
    centerLon: '',
    radiusM: 300,
    serviceIds: [],
    title: '',
    purpose: '',
    description: '',
    preferredDate: '',
    preferredTimeId: 'MORNING',
  })
  const [calYear, setCalYear] = useState(today.getFullYear())
  const [calMonth, setCalMonth] = useState(today.getMonth())
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [createdId, setCreatedId] = useState<string | null>(null)

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  function toggleService(id: string) {
    setForm((f) => {
      const next = f.serviceIds.includes(id)
        ? f.serviceIds.filter((s) => s !== id)
        : [...f.serviceIds, id]
      return { ...f, serviceIds: next }
    })
    setErrors((e) => ({ ...e, serviceIds: undefined }))
  }

  // ── Validation ──────────────────────────────────────────

  function validateStep1(): boolean {
    const errs: typeof errors = {}
    if (!form.addressText.trim()) errs.addressText = 'Vui lòng nhập địa chỉ khu vực giám sát'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function validateStep2(): boolean {
    const errs: typeof errors = {}
    if (form.serviceIds.length === 0) errs.serviceIds = 'Vui lòng chọn ít nhất một dịch vụ'
    if (!form.title.trim()) errs.title = 'Tiêu đề là bắt buộc'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function validateStep3(): boolean {
    const errs: typeof errors = {}
    if (!form.preferredDate) errs.preferredDate = 'Vui lòng chọn ngày bay'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleNext() {
    if (step === 1 && !validateStep1()) return
    if (step === 2 && !validateStep2()) return
    if (step === 3 && !validateStep3()) return
    if (step < 4) setStep((s) => (s + 1) as Step)
  }

  function handleBack() {
    if (step > 1) setStep((s) => (s - 1) as Step)
  }

  // ── Submit → createOrder → goto analysis ────────────────

  async function handleSubmit() {
    setSubmitting(true)
    setSubmitError(null)
    const slotDef = TIME_SLOTS.find((t) => t.id === form.preferredTimeId)
    try {
      const payload: CreateOrderPayload = {
        title: form.title.trim(),
        purpose: form.purpose.trim() || undefined,
        description: form.description.trim() || undefined,
        serviceIds: form.serviceIds,
        addressText: form.addressText.trim(),
        centerLat: form.centerLat ? parseFloat(form.centerLat) : 0,
        centerLon: form.centerLon ? parseFloat(form.centerLon) : 0,
        radiusM: form.radiusM,
        preferredDate: form.preferredDate,
        preferredTimeName: slotDef ? `${slotDef.label} ${slotDef.detail}` : '',
      }
      const result = await customerApi.createOrder(payload)
      setCreatedId(result.id)
    } catch (e: unknown) {
      setSubmitError(e instanceof Error ? e.message : 'Có lỗi xảy ra. Vui lòng thử lại.')
      setSubmitting(false)
    }
  }

  // ── Success screen ───────────────────────────────────────

  if (createdId) {
    return (
      <div style={{ maxWidth: 480, margin: '60px auto', textAlign: 'center' }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'var(--green-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
            margin: '0 auto 20px',
          }}
        >
          ✓
        </div>
        <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700 }}>
          Đơn đã được lưu!
        </h2>
        <p style={{ color: 'var(--tx3)', fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>
          Tiếp theo hệ thống sẽ phân tích tính khả thi.
          Bạn cần xem kết quả và gửi duyệt để hoàn tất.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a
            href={customerHref({ screen: 'analysis', orderId: createdId })}
            className="odm-btn odm-btn-p"
            style={{ fontSize: 14, height: 40, padding: '0 20px' }}
          >
            Xem phân tích AI →
          </a>
          <a
            href={customerHref({ screen: 'orderDetail', orderId: createdId })}
            className="odm-btn odm-btn-gh"
          >
            Xem đơn hàng
          </a>
        </div>
      </div>
    )
  }

  // ── Wizard shell ─────────────────────────────────────────

  return (
    <div style={{ maxWidth: 720 }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
        }}
      >
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Tạo yêu cầu giám sát</h1>
        <a
          href={customerHref({ screen: 'orders' })}
          style={{ fontSize: 13, color: 'var(--tx3)', textDecoration: 'none' }}
        >
          ← Huỷ
        </a>
      </div>

      {/* Step progress bar */}
      <div style={{ marginBottom: 28 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            border: '1px solid var(--bd)',
            borderRadius: 8,
            overflow: 'hidden',
          }}
        >
          {([1, 2, 3, 4] as Step[]).map((s) => (
            <div
              key={s}
              style={{
                padding: '10px 12px',
                background: step === s ? 'var(--ink)' : step > s ? 'var(--sf2)' : 'var(--sf)',
                color: step === s ? 'var(--inkfg)' : step > s ? 'var(--tx)' : 'var(--tx3)',
                fontWeight: step === s ? 700 : 500,
                fontSize: 12,
                borderRight: s < 4 ? '1px solid var(--bd)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  background:
                    step === s
                      ? 'rgba(255,255,255,0.25)'
                      : step > s
                        ? 'var(--green-bg)'
                        : 'var(--sf3)',
                  color: step > s ? 'var(--green-fg)' : 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {step > s ? '✓' : s}
              </span>
              <span style={{ lineHeight: 1.3 }}>{STEP_LABELS[s]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Step 1: Location ──────────────────────────────── */}
      {step === 1 && <Step1Location form={form} update={update} errors={errors} />}

      {/* ── Step 2: Services + info ───────────────────────── */}
      {step === 2 && (
        <Step2Services
          form={form}
          update={update}
          toggleService={toggleService}
          errors={errors}
        />
      )}

      {/* ── Step 3: Date + timeslot ───────────────────────── */}
      {step === 3 && (
        <Step3Time
          form={form}
          update={update}
          errors={errors}
          calYear={calYear}
          calMonth={calMonth}
          setCalYear={setCalYear}
          setCalMonth={setCalMonth}
          today={today}
        />
      )}

      {/* ── Step 4: Review ────────────────────────────────── */}
      {step === 4 && <Step4Review form={form} />}

      {/* ── Navigation ────────────────────────────────────── */}
      {submitError && (
        <div
          role="alert"
          style={{
            background: 'var(--red-muted, #fee2e2)',
            border: '1px solid var(--red-solid)',
            borderRadius: 8,
            padding: '10px 14px',
            marginBottom: 12,
            fontSize: 13,
            color: 'var(--red-solid)',
          }}
        >
          {submitError}
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, marginTop: 28, alignItems: 'center' }}>
        {step > 1 && (
          <button
            type="button"
            className="odm-btn odm-btn-gh"
            style={{ height: 38 }}
            onClick={handleBack}
          >
            ← Quay lại
          </button>
        )}
        <div style={{ flex: 1 }} />
        {step < 4 ? (
          <button
            type="button"
            className="odm-btn odm-btn-p"
            style={{ height: 38, padding: '0 24px', fontSize: 14 }}
            onClick={handleNext}
          >
            Tiếp tục: {STEP_LABELS[(step + 1) as Step]} →
          </button>
        ) : (
          <button
            type="button"
            className="odm-btn odm-btn-p"
            style={{ height: 40, padding: '0 28px', fontSize: 14 }}
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? 'Đang phân tích...' : '🔍 Phân tích tính khả thi'}
          </button>
        )}
      </div>
    </div>
  )
}

// ── Step 1 component ──────────────────────────────────────

function Step1Location({
  form,
  update,
  errors,
}: {
  form: FormState
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void
  errors: Partial<Record<string, string>>
}) {
  const area = calcArea(form.radiusM)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Map placeholder */}
      <div
        style={{
          height: 260,
          background: 'var(--bg)',
          border: '1px solid var(--bd)',
          borderRadius: 10,
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Map grid pattern */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(var(--bd) 1px, transparent 1px), linear-gradient(90deg, var(--bd) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            opacity: 0.5,
          }}
        />
        {/* Radius circle visualisation */}
        <div
          style={{
            position: 'absolute',
            width: Math.min(200, form.radiusM / 4),
            height: Math.min(200, form.radiusM / 4),
            borderRadius: '50%',
            border: '2px solid var(--blue-solid)',
            background: 'rgba(31,111,214,0.1)',
          }}
        />
        {/* Center pin */}
        <div
          style={{
            position: 'absolute',
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: 'var(--blue-solid)',
            border: '2px solid var(--sf)',
            boxShadow: '0 2px 6px rgba(31,111,214,.5)',
          }}
        />
        {/* Map label */}
        <div
          style={{
            position: 'absolute',
            bottom: 10,
            right: 10,
            background: 'var(--sf)',
            border: '1px solid var(--bd)',
            borderRadius: 6,
            padding: '4px 8px',
            fontSize: 11,
            color: 'var(--tx3)',
          }}
        >
          Bản đồ · Nhập địa chỉ để định vị
        </div>
      </div>

      {/* Address field */}
      <div>
        <label
          htmlFor="cus-address"
          style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}
        >
          Địa chỉ khu vực giám sát{' '}
          <span style={{ color: 'var(--red-solid)' }}>*</span>
        </label>
        <input
          id="cus-address"
          className="odm-input"
          type="text"
          placeholder="VD: KCN Long Hậu, xã Long Hậu, huyện Cần Giuộc, tỉnh Long An"
          value={form.addressText}
          onChange={(e) => update('addressText', e.target.value)}
          aria-invalid={!!errors.addressText}
          style={{ height: 38 }}
        />
        {errors.addressText && (
          <div style={{ fontSize: 12, color: 'var(--red-solid)', marginTop: 4 }}>
            {errors.addressText}
          </div>
        )}
      </div>

      {/* Coordinates (optional) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label
            htmlFor="cus-lat"
            style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}
          >
            Vĩ độ (center_lat)
          </label>
          <input
            id="cus-lat"
            className="odm-input"
            type="text"
            placeholder="10.6402"
            value={form.centerLat}
            onChange={(e) => update('centerLat', e.target.value)}
            style={{ fontFamily: 'var(--font-mono)', height: 38 }}
          />
        </div>
        <div>
          <label
            htmlFor="cus-lon"
            style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}
          >
            Kinh độ (center_lon)
          </label>
          <input
            id="cus-lon"
            className="odm-input"
            type="text"
            placeholder="106.6912"
            value={form.centerLon}
            onChange={(e) => update('centerLon', e.target.value)}
            style={{ fontFamily: 'var(--font-mono)', height: 38 }}
          />
        </div>
      </div>

      {/* Radius slider */}
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: 8,
          }}
        >
          <label style={{ fontSize: 13, fontWeight: 600 }}>
            Bán kính giám sát (radius_m)
          </label>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 15,
              fontWeight: 700,
              color: 'var(--blue-solid)',
            }}
          >
            {form.radiusM} m
          </span>
        </div>
        <input
          type="range"
          min={100}
          max={1500}
          step={50}
          value={form.radiusM}
          onChange={(e) => update('radiusM', parseInt(e.target.value))}
          style={{ width: '100%', accentColor: 'var(--blue-solid)' }}
        />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 11,
            color: 'var(--tx3)',
            marginTop: 4,
          }}
        >
          <span>100 m</span>
          <span>1.500 m</span>
        </div>

        {/* Or pick preset buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
          {RADIUS_OPTIONS.filter((r) => r <= 1000).map((r) => (
            <button
              key={r}
              type="button"
              className={`odm-btn ${form.radiusM === r ? 'odm-btn-p' : 'odm-btn-gh'}`}
              style={{ fontSize: 12, height: 26, padding: '0 10px' }}
              onClick={() => update('radiusM', r)}
            >
              {r >= 1000 ? `${r / 1000} km` : `${r} m`}
            </button>
          ))}
        </div>

        {/* Area estimate */}
        <div
          style={{
            marginTop: 12,
            padding: '8px 12px',
            background: 'var(--sf)',
            border: '1px solid var(--bd)',
            borderRadius: 8,
            display: 'flex',
            gap: 16,
            fontSize: 13,
          }}
        >
          <span style={{ color: 'var(--tx3)' }}>Diện tích ước tính:</span>
          <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{area}</span>
        </div>
      </div>
    </div>
  )
}

// ── Step 2 component ──────────────────────────────────────

function Step2Services({
  form,
  update,
  toggleService,
  errors,
}: {
  form: FormState
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void
  toggleService: (id: string) => void
  errors: Partial<Record<string, string>>
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Service cards */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
          Loại dịch vụ{' '}
          <span style={{ color: 'var(--red-solid)' }}>*</span>
          <span style={{ fontWeight: 400, color: 'var(--tx3)', marginLeft: 6 }}>
            Chọn được nhiều dịch vụ
          </span>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 10,
          }}
        >
          {SERVICES.map((svc) => {
            const selected = form.serviceIds.includes(svc.id)
            return (
              <button
                key={svc.id}
                type="button"
                onClick={() => toggleService(svc.id)}
                style={{
                  textAlign: 'left',
                  padding: '12px 14px',
                  background: selected ? 'var(--blue-bg)' : 'var(--sf)',
                  border: `1.5px solid ${selected ? 'var(--blue-solid)' : 'var(--bd)'}`,
                  borderRadius: 10,
                  cursor: 'pointer',
                  transition: 'border-color 0.15s',
                }}
              >
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 20 }}>{svc.icon}</span>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: selected ? 'var(--blue-fg)' : 'var(--tx)',
                      lineHeight: 1.3,
                    }}
                  >
                    {svc.label}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--tx3)', lineHeight: 1.5, marginBottom: 8 }}>
                  {svc.description}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {svc.sensors.map((s) => (
                    <span
                      key={s}
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        padding: '1px 6px',
                        borderRadius: 4,
                        background: 'var(--gray-bg)',
                        color: 'var(--gray-fg)',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {s}
                    </span>
                  ))}
                  <span
                    style={{
                      fontSize: 10,
                      padding: '1px 6px',
                      borderRadius: 4,
                      background: 'var(--sf2)',
                      color: 'var(--tx3)',
                      marginLeft: 'auto',
                    }}
                  >
                    ~{svc.durationMin} phút · {svc.heightRange}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
        {errors.serviceIds && (
          <div style={{ fontSize: 12, color: 'var(--red-solid)', marginTop: 6 }}>
            {errors.serviceIds}
          </div>
        )}
      </div>

      {/* Divider */}
      <hr style={{ border: 'none', borderTop: '1px solid var(--bd)', margin: 0 }} />

      {/* Thông tin yêu cầu */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, color: 'var(--tx2)' }}>
          Thông tin yêu cầu
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label
              htmlFor="cus-title"
              style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}
            >
              Tiêu đề{' '}
              <span style={{ color: 'var(--red-solid)' }}>*</span>
            </label>
            <input
              id="cus-title"
              className="odm-input"
              type="text"
              placeholder="VD: Kiểm tra nhiệt mái nhà xưởng KCN Long Hậu"
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              aria-invalid={!!errors.title}
              style={{ height: 38 }}
            />
            {errors.title && (
              <div style={{ fontSize: 12, color: 'var(--red-solid)', marginTop: 4 }}>
                {errors.title}
              </div>
            )}
          </div>

          <div>
            <label
              htmlFor="cus-purpose"
              style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}
            >
              Mục đích
            </label>
            <input
              id="cus-purpose"
              className="odm-input"
              type="text"
              placeholder="VD: Phát hiện điểm nóng bất thường trước ngày 30/09"
              value={form.purpose}
              onChange={(e) => update('purpose', e.target.value)}
              style={{ height: 38 }}
            />
          </div>

          <div>
            <label
              htmlFor="cus-desc"
              style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}
            >
              Mô tả chi tiết
            </label>
            <textarea
              id="cus-desc"
              className="odm-input"
              rows={3}
              placeholder="Mô tả khu vực, yêu cầu đặc biệt, hạng mục cần kiểm tra..."
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              style={{ resize: 'vertical', paddingTop: 8, lineHeight: 1.5 }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Step 3 component ──────────────────────────────────────

function Step3Time({
  form,
  update,
  errors,
  calYear,
  calMonth,
  setCalYear,
  setCalMonth,
  today,
}: {
  form: FormState
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void
  errors: Partial<Record<string, string>>
  calYear: number
  calMonth: number
  setCalYear: (y: number) => void
  setCalMonth: (m: number) => void
  today: Date
}) {
  const cells = buildCalendar(calYear, calMonth)

  // Min date = tomorrow (need at least 24h lead time)
  const minDate = new Date(today)
  minDate.setDate(minDate.getDate() + 1)

  function isDisabled(day: number): boolean {
    const d = new Date(calYear, calMonth, day)
    return d < minDate
  }

  function prevMonth() {
    if (calMonth === 0) { setCalYear(calYear - 1); setCalMonth(11) }
    else setCalMonth(calMonth - 1)
  }

  function nextMonth() {
    if (calMonth === 11) { setCalYear(calYear + 1); setCalMonth(0) }
    else setCalMonth(calMonth + 1)
  }

  function selectDay(day: number) {
    if (isDisabled(day)) return
    const iso = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    update('preferredDate', iso)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Calendar */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
          Ngày bay mong muốn{' '}
          <span style={{ color: 'var(--red-solid)' }}>*</span>
        </div>
        <div
          style={{
            background: 'var(--sf)',
            border: '1px solid var(--bd)',
            borderRadius: 10,
            padding: '16px',
            maxWidth: 340,
          }}
        >
          {/* Month nav */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}
          >
            <button
              type="button"
              className="odm-btn odm-btn-gh"
              style={{ height: 28, padding: '0 10px', fontSize: 12 }}
              onClick={prevMonth}
            >
              ‹
            </button>
            <span style={{ fontWeight: 700, fontSize: 14 }}>
              {MONTH_NAMES[calMonth]}, {calYear}
            </span>
            <button
              type="button"
              className="odm-btn odm-btn-gh"
              style={{ height: 28, padding: '0 10px', fontSize: 12 }}
              onClick={nextMonth}
            >
              ›
            </button>
          </div>

          {/* Day-of-week headers */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: 2,
              marginBottom: 4,
            }}
          >
            {DAY_NAMES.map((d) => (
              <div
                key={d}
                style={{
                  textAlign: 'center',
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--tx3)',
                  padding: '2px 0',
                }}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: 2,
            }}
          >
            {cells.map((day, i) => {
              if (!day) return <div key={`e-${i}`} />
              const iso = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const selected = form.preferredDate === iso
              const disabled = isDisabled(day)
              return (
                <button
                  key={day}
                  type="button"
                  disabled={disabled}
                  onClick={() => selectDay(day)}
                  style={{
                    height: 32,
                    border: 'none',
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: selected ? 700 : 400,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    background: selected
                      ? 'var(--blue-solid)'
                      : disabled
                        ? 'transparent'
                        : 'transparent',
                    color: selected
                      ? '#fff'
                      : disabled
                        ? 'var(--tx3)'
                        : 'var(--tx)',
                    opacity: disabled ? 0.35 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!selected && !disabled) {
                      ;(e.currentTarget as HTMLButtonElement).style.background = 'var(--sf3)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!selected)
                      (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                  }}
                >
                  {day}
                </button>
              )
            })}
          </div>
        </div>

        {form.preferredDate && (
          <div
            style={{
              marginTop: 8,
              fontSize: 13,
              color: 'var(--green-fg)',
              fontWeight: 600,
            }}
          >
            ✓ Đã chọn: {fmtDateVi(form.preferredDate)}
          </div>
        )}
        {errors.preferredDate && (
          <div style={{ fontSize: 12, color: 'var(--red-solid)', marginTop: 4 }}>
            {errors.preferredDate}
          </div>
        )}
      </div>

      {/* Time slots */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
          Khung giờ mong muốn
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {TIME_SLOTS.map((slot) => {
            const active = form.preferredTimeId === slot.id
            return (
              <button
                key={slot.id}
                type="button"
                onClick={() => update('preferredTimeId', slot.id)}
                style={{
                  padding: '10px 20px',
                  background: active ? 'var(--blue-bg)' : 'var(--sf)',
                  border: `1.5px solid ${active ? 'var(--blue-solid)' : 'var(--bd)'}`,
                  borderRadius: 8,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 13,
                    color: active ? 'var(--blue-fg)' : 'var(--tx)',
                  }}
                >
                  {slot.label}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: active ? 'var(--blue-dot)' : 'var(--tx3)',
                    fontFamily: 'var(--font-mono)',
                    marginTop: 2,
                  }}
                >
                  {slot.detail}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Info note */}
      <div
        style={{
          background: 'var(--yellow-bg)',
          border: '1px solid var(--yellow-dot)',
          borderRadius: 8,
          padding: '10px 14px',
          fontSize: 12,
          color: 'var(--yellow-fg)',
        }}
      >
        ⓘ Ngày đặt trước phải cách hiện tại tối thiểu 24 giờ. AI sẽ kiểm tra điều kiện
        thời tiết và năng lực thực hiện ở bước tiếp theo.
      </div>
    </div>
  )
}

// ── Step 4 component ──────────────────────────────────────

function Step4Review({ form }: { form: FormState }) {
  const slotDef = TIME_SLOTS.find((t) => t.id === form.preferredTimeId)
  const selectedServices = SERVICES.filter((s) => form.serviceIds.includes(s.id))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Tóm tắt yêu cầu</h2>

      {/* Location */}
      <ReviewSection
        title="📍 Vị trí giám sát"
        rows={[
          { label: 'Địa chỉ', value: form.addressText || '—' },
          {
            label: 'Tọa độ',
            value:
              form.centerLat && form.centerLon
                ? `${form.centerLat}, ${form.centerLon}`
                : 'Chưa nhập',
            mono: true,
          },
          { label: 'Bán kính', value: `${form.radiusM} m (${calcArea(form.radiusM)})`, mono: true },
        ]}
      />

      {/* Services */}
      <div
        style={{
          background: 'var(--sf)',
          border: '1px solid var(--bd)',
          borderRadius: 10,
          padding: '14px 16px',
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>
          🛸 Dịch vụ ({selectedServices.length})
        </div>
        {selectedServices.length === 0 ? (
          <span style={{ color: 'var(--tx3)', fontSize: 13 }}>Chưa chọn</span>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {selectedServices.map((s) => (
              <div
                key={s.id}
                style={{
                  display: 'flex',
                  gap: 8,
                  alignItems: 'center',
                  fontSize: 13,
                }}
              >
                <span>{s.icon}</span>
                <span style={{ fontWeight: 600 }}>{s.label}</span>
                <span style={{ color: 'var(--tx3)', fontSize: 12 }}>
                  {s.sensors.join(' · ')} · ~{s.durationMin} phút
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Title */}
      <ReviewSection
        title="📝 Thông tin yêu cầu"
        rows={[
          { label: 'Tiêu đề', value: form.title || '—' },
          ...(form.purpose ? [{ label: 'Mục đích', value: form.purpose }] : []),
          ...(form.description ? [{ label: 'Mô tả', value: form.description }] : []),
        ]}
      />

      {/* Time */}
      <ReviewSection
        title="📅 Thời gian"
        rows={[
          {
            label: 'Ngày bay',
            value: form.preferredDate ? fmtDateVi(form.preferredDate) : '—',
          },
          {
            label: 'Khung giờ',
            value: slotDef ? `${slotDef.label} ${slotDef.detail}` : '—',
          },
        ]}
      />

      {/* AI note */}
      <div
        style={{
          background: 'var(--blue-bg)',
          border: '1px solid var(--blue-dot)',
          borderRadius: 10,
          padding: '14px 16px',
          fontSize: 13,
        }}
      >
        <div style={{ fontWeight: 700, color: 'var(--blue-fg)', marginBottom: 6 }}>
          🔍 Phân tích tính khả thi
        </div>
        <div style={{ color: 'var(--blue-fg)', lineHeight: 1.6 }}>
          Hệ thống sẽ kiểm tra 5 nhóm điều kiện: thời gian, địa lý (vùng cấm bay),
          năng lực drone, nguồn lực và an toàn. Kết quả trả về ngay sau khi nhấn nút.
        </div>
      </div>
    </div>
  )
}

// ── ReviewSection helper ──────────────────────────────────

function ReviewSection({
  title,
  rows,
}: {
  title: string
  rows: { label: string; value: string; mono?: boolean }[]
}) {
  return (
    <div
      style={{
        background: 'var(--sf)',
        border: '1px solid var(--bd)',
        borderRadius: 10,
        padding: '14px 16px',
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>{title}</div>
      <div className="odm-cus-detail-grid">
        {rows.map((r) => (
          <div key={r.label}>
            <div className="odm-cus-detail-label">{r.label}</div>
            <div
              className="odm-cus-detail-value"
              style={r.mono ? { fontFamily: 'var(--font-mono)', fontSize: 12 } : undefined}
            >
              {r.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
