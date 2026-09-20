import { useState } from 'react'

import { customerApi, type CreateOrderPayload } from '../api/customerApi'
import { customerHref } from '../routes'

// ── Constants ─────────────────────────────────────────────

type Step = 1 | 2 | 3 | 4

const STEP_LABELS: Record<Step, string> = {
  1: 'Vị trí giám sát',
  2: 'Dịch vụ và mục đích',
  3: 'Thời gian và media',
  4: 'Xem lại và phân tích',
}

type ServiceDef = {
  id: string
  label: string
  description: string
  sensors: string[]
  durationMin: number
  heightRange: string
}

const SERVICES: ServiceDef[] = [
  {
    id: 'svc-construction',
    label: 'Giám sát tiến độ công trình',
    description: 'Ghi hình định kỳ để đối chiếu tiến độ thi công theo từng mốc.',
    sensors: ['RGB'],
    durationMin: 40,
    heightRange: '30–120 m',
  },
  {
    id: 'svc-thermal',
    label: 'Kiểm tra nhiệt mái và tấm pin',
    description: 'Phát hiện điểm nóng bất thường trên mái nhà xưởng, tủ điện, tấm pin.',
    sensors: ['THERMAL'],
    durationMin: 35,
    heightRange: '20–100 m',
  },
  {
    id: 'svc-security',
    label: 'Tuần tra an ninh khu vực',
    description: 'Bay tuần tra theo vòng bán kính, ghi hình và phát trực tiếp.',
    sensors: ['RGB', 'ZOOM (tuỳ chọn)'],
    durationMin: 30,
    heightRange: '40–120 m',
  },
  {
    id: 'svc-ndvi',
    label: 'Giám sát cây trồng (NDVI)',
    description: 'Đánh giá sức khoẻ cây trồng bằng ảnh đa phổ.',
    sensors: ['MULTISPECTRAL'],
    durationMin: 45,
    heightRange: '30–120 m',
  },
  {
    id: 'svc-traffic',
    label: 'Giám sát giao thông và sự kiện',
    description: 'Quan sát lưu lượng phương tiện, mật độ đám đông theo thời gian thực.',
    sensors: ['RGB', 'ZOOM'],
    durationMin: 30,
    heightRange: '60–120 m',
  },
  {
    id: 'svc-mapping',
    label: 'Bản đồ 2D/3D (orthomosaic)',
    description: 'Bay lưới, xuất ảnh ghép và mô hình địa hình.',
    sensors: ['RGB'],
    durationMin: 50,
    heightRange: '60–120 m',
  },
]

const TIME_SLOTS = [
  { id: 'MORNING', label: 'Buổi sáng', detail: '07:00–11:00' },
  { id: 'AFTERNOON', label: 'Buổi chiều', detail: '13:00–17:00' },
]

const MONTH_NAMES = [
  'Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6',
  'Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12',
]
const DAY_NAMES = ['T2','T3','T4','T5','T6','T7','CN']

function buildCalendar(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = []
  const startOffset = (firstDay + 6) % 7
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  return cells
}

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

// ── Shared layout tokens ──────────────────────────────────

const card: React.CSSProperties = {
  background: 'var(--sf)',
  border: '1px solid var(--bd)',
  borderRadius: 10,
}

const cardHead: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '10px 16px',
  borderBottom: '1px solid var(--bd)',
  fontWeight: 700,
  fontSize: 13,
}

const cardBody: React.CSSProperties = {
  padding: '16px',
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

  // ── Success redirect ─────────────────────────────────────

  if (createdId) {
    return (
      <div style={{ maxWidth: 480, margin: '60px auto', textAlign: 'center' }}>
        <div
          style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'var(--green-bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, margin: '0 auto 20px',
          }}
        >
          ✓
        </div>
        <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700 }}>Đơn đã được lưu!</h2>
        <p style={{ color: 'var(--tx3)', fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>
          Tiếp theo hệ thống sẽ phân tích tính khả thi. Bạn cần xem kết quả và gửi duyệt để hoàn tất.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href={customerHref({ screen: 'analysis', orderId: createdId })} className="odm-btn odm-btn-p">
            Xem phân tích AI →
          </a>
          <a href={customerHref({ screen: 'orderDetail', orderId: createdId })} className="odm-btn odm-btn-gh">
            Xem đơn hàng
          </a>
        </div>
      </div>
    )
  }

  // ── Wizard shell ─────────────────────────────────────────

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, height: '100%' }}>
      {/* ── Top header bar ── */}
      <div
        style={{
          display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
          gap: 16, marginBottom: 14,
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: '-.01em', lineHeight: 1.25 }}>
            Tạo yêu cầu giám sát
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
          <a
            href={customerHref({ screen: 'orders' })}
            className="odm-btn odm-btn-gh"
            style={{ fontSize: 13, height: 32 }}
          >
            Huỷ
          </a>
        </div>
      </div>

      {/* ── Step tabs ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 16 }}>
        {([1, 2, 3, 4] as Step[]).map((s) => {
          const done = step > s
          const active = step === s
          return (
            <button
              key={s}
              type="button"
              onClick={() => {
                if (done) setStep(s)
              }}
              style={{
                flex: 1,
                display: 'flex', alignItems: 'center', gap: 10,
                height: 44, padding: '0 14px',
                border: '1px solid var(--bd)',
                background: active ? 'var(--ink)' : done ? 'var(--sf2)' : 'var(--sf)',
                cursor: done ? 'pointer' : 'default',
                font: `600 13px 'IBM Plex Sans',system-ui,sans-serif`,
                color: active ? 'var(--inkfg)' : done ? 'var(--tx2)' : 'var(--tx3)',
                textAlign: 'left',
                borderRadius:
                  s === 1 ? '8px 0 0 8px' : s === 4 ? '0 8px 8px 0' : '0',
                marginLeft: s > 1 ? -1 : 0,
                transition: 'background .15s',
              }}
            >
              <span
                style={{
                  width: 22, height: 22, borderRadius: '50%',
                  background: active ? 'rgba(255,255,255,.2)' : done ? 'var(--green-bg)' : 'var(--sf3)',
                  color: active ? 'var(--inkfg)' : done ? 'var(--green-fg)' : 'var(--tx2)',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, flexShrink: 0,
                }}
              >
                {done ? '✓' : s}
              </span>
              {STEP_LABELS[s]}
            </button>
          )
        })}
      </div>

      {/* ── Step content ── */}
      {step === 1 && (
        <Step1Location form={form} update={update} errors={errors} />
      )}
      {step === 2 && (
        <Step2Services form={form} update={update} toggleService={toggleService} errors={errors} />
      )}
      {step === 3 && (
        <Step3Time
          form={form} update={update} errors={errors}
          calYear={calYear} calMonth={calMonth}
          setCalYear={setCalYear} setCalMonth={setCalMonth}
          today={today}
        />
      )}
      {step === 4 && <Step4Review form={form} />}

      {/* ── Footer nav ── */}
      {submitError && (
        <div
          role="alert"
          style={{
            marginTop: 12,
            background: 'var(--red-bg)', border: '1px solid var(--red-dot)',
            borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--red-fg)',
          }}
        >
          {submitError}
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, marginTop: 16, alignItems: 'center' }}>
        {step > 1 && (
          <button type="button" className="odm-btn odm-btn-gh" onClick={handleBack}>
            ← Quay lại
          </button>
        )}
        <div style={{ flex: 1 }} />
        {step < 4 ? (
          <button
            type="button"
            className="odm-btn odm-btn-p"
            style={{ height: 38, padding: '0 20px' }}
            onClick={handleNext}
          >
            Tiếp tục: {STEP_LABELS[(step + 1) as Step]} →
          </button>
        ) : (
          <button
            type="button"
            className="odm-btn odm-btn-p"
            style={{ height: 40, padding: '0 24px', fontSize: 14 }}
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

// ── Step 1: Vị trí giám sát ───────────────────────────────
// Layout: Left = Map | Right = form card 330px

function Step1Location({
  form, update, errors,
}: {
  form: FormState
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void
  errors: Partial<Record<string, string>>
}) {
  const area = calcArea(form.radiusM)
  const circleR = Math.max(20, Math.min(160, form.radiusM / 5))

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 330px', gap: 14 }}>
      {/* ── Left: Map ── */}
      <div
        style={{
          ...card,
          position: 'relative', height: 560, overflow: 'hidden',
        }}
      >
        {/* Map grid background */}
        <div
          style={{
            position: 'absolute', inset: 0,
            background: 'var(--map-bg)',
          }}
        />
        {/* Roads H */}
        {[168, 347].map((y) => (
          <div key={y} style={{ position: 'absolute', left: 0, right: 0, top: y, height: 12, background: 'var(--map-road2)' }} />
        ))}
        {/* Roads V */}
        {[224, 528].map((x) => (
          <div key={x} style={{ position: 'absolute', top: 0, bottom: 0, left: x, width: 12, background: 'var(--map-road2)' }} />
        ))}
        {/* Park blocks */}
        {[{ x: 48, y: 56, w: 96, h: 90 }, { x: 592, y: 44, w: 112, h: 101 }].map((r, i) => (
          <div key={i} style={{ position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h, background: 'var(--map-park)', borderRadius: 10 }} />
        ))}
        {/* Building blocks */}
        {[
          { x: 280, y: 200, w: 80, h: 60 }, { x: 400, y: 180, w: 100, h: 80 },
          { x: 120, y: 300, w: 70, h: 50 }, { x: 500, y: 310, w: 90, h: 65 },
        ].map((r, i) => (
          <div key={i} style={{ position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h, background: 'var(--map-block)', borderRadius: 4 }} />
        ))}
        {/* Radius circle + center pin */}
        <div
          style={{
            position: 'absolute',
            left: '50%', top: '50%',
            width: circleR * 2, height: circleR * 2,
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
            border: '2px solid var(--blue-solid)',
            background: 'rgba(31,111,214,.12)',
          }}
        />
        <div
          style={{
            position: 'absolute', left: '50%', top: '50%',
            transform: 'translate(-50%, -50%)',
            width: 12, height: 12, borderRadius: '50%',
            background: 'var(--blue-solid)', border: '2px solid #fff',
            boxShadow: '0 2px 6px rgba(31,111,214,.5)',
          }}
        />
        {/* Legend */}
        <div
          style={{
            position: 'absolute', right: 12, bottom: 12,
            padding: '8px 10px', borderRadius: 8,
            background: 'var(--sf)', border: '1px solid var(--bd)',
            fontSize: 11.5, display: 'flex', flexDirection: 'column', gap: 5,
            boxShadow: 'var(--shadow)',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--red-bg)', border: '1.5px solid var(--red-dot)', display: 'inline-block' }} />
            Vùng cấm bay
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--green-bg)', border: '1.5px dashed var(--green-dot)', display: 'inline-block' }} />
            Vùng phủ trạm
          </span>
        </div>
      </div>

      {/* ── Right: Form card ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        <div style={card}>
          <div style={cardHead}>Vị trí và bán kính</div>
          <div style={{ ...cardBody, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Address */}
            <div>
              <label htmlFor="cus-addr" className="odm-cus-detail-label" style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--tx2)', marginBottom: 4 }}>
                Địa chỉ (address_text)
              </label>
              <textarea
                id="cus-addr"
                className="odm-input"
                rows={3}
                placeholder="VD: KCN Long Hậu, xã Long Hậu, huyện Cần Giuộc, tỉnh Long An"
                value={form.addressText}
                onChange={(e) => update('addressText', e.target.value)}
                style={{ resize: 'none', paddingTop: 8, lineHeight: 1.5, fontSize: 13 }}
              />
              {form.addressText && (
                <div style={{ fontSize: 11.5, color: 'var(--tx3)', marginTop: 4 }}>
                  Tự điền từ ghim, có thể chỉnh sửa
                </div>
              )}
              {errors.addressText && (
                <div style={{ fontSize: 11.5, color: 'var(--red-fg)', marginTop: 4 }}>{errors.addressText}</div>
              )}
            </div>

            {/* Lat / Lon */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--tx2)', marginBottom: 4 }}>center_lat</label>
                <input
                  className="odm-input"
                  type="text"
                  placeholder="10.6402"
                  value={form.centerLat}
                  onChange={(e) => update('centerLat', e.target.value)}
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 12, height: 34 }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--tx2)', marginBottom: 4 }}>center_lon</label>
                <input
                  className="odm-input"
                  type="text"
                  placeholder="106.6912"
                  value={form.centerLon}
                  onChange={(e) => update('centerLon', e.target.value)}
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 12, height: 34 }}
                />
              </div>
            </div>

            {/* Radius slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--tx2)' }}>
                  Bán kính giám sát (radius_m)
                </label>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color: 'var(--blue-solid)' }}>
                  {form.radiusM} m
                </span>
              </div>
              <input
                type="range"
                min={100} max={1500} step={50}
                value={form.radiusM}
                onChange={(e) => update('radiusM', parseInt(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--blue-solid)' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--tx3)', marginTop: 3 }}>
                <span>100 m</span>
                <span>1.500 m</span>
              </div>
              {/* Area estimate */}
              <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ background: 'var(--sf2)', borderRadius: 6, padding: '8px 10px', fontSize: 12 }}>
                  <div style={{ color: 'var(--tx3)', marginBottom: 2 }}>Diện tích ước tính</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 14, color: 'var(--tx)' }}>{area}</div>
                </div>
                <div style={{ background: 'var(--sf2)', borderRadius: 6, padding: '8px 10px', fontSize: 12 }}>
                  <div style={{ color: 'var(--tx3)', marginBottom: 2 }}>Trạm gần nhất</div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>—</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Step 2: Dịch vụ và mục đích ───────────────────────────
// Layout: Left = 3-col service cards | Right = form card 340px

function Step2Services({
  form, update, toggleService, errors,
}: {
  form: FormState
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void
  toggleService: (id: string) => void
  errors: Partial<Record<string, string>>
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 340px', gap: 14 }}>
      {/* ── Left: Service cards ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--tx2)', marginBottom: 2 }}>
          Chọn dịch vụ
          <span style={{ fontWeight: 400, color: 'var(--tx3)', marginLeft: 8 }}>
            Chọn được nhiều dịch vụ (order_item)
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 10 }}>
          {SERVICES.map((svc) => {
            const selected = form.serviceIds.includes(svc.id)
            return (
              <button
                key={svc.id}
                type="button"
                onClick={() => toggleService(svc.id)}
                style={{
                  textAlign: 'left', padding: '14px 14px 12px',
                  background: selected ? 'var(--blue-bg)' : 'var(--sf)',
                  border: `1.5px solid ${selected ? 'var(--blue-solid)' : 'var(--bd)'}`,
                  borderRadius: 10, cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', gap: 8,
                  transition: 'border-color .15s',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 13, color: selected ? 'var(--blue-fg)' : 'var(--tx)', lineHeight: 1.3 }}>
                  {svc.label}
                </div>
                <div style={{ fontSize: 12, color: 'var(--tx3)', lineHeight: 1.5, flexGrow: 1 }}>
                  {svc.description}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {svc.sensors.map((s) => (
                    <span
                      key={s}
                      style={{
                        fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 4,
                        background: 'var(--gray-bg)', color: 'var(--gray-fg)',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: 'var(--tx3)' }}>
                  {svc.durationMin} phút · {svc.heightRange}
                </div>
              </button>
            )
          })}
        </div>
        {errors.serviceIds && (
          <div style={{ fontSize: 12, color: 'var(--red-fg)', marginTop: 2 }}>{errors.serviceIds}</div>
        )}
      </div>

      {/* ── Right: Info card ── */}
      <div style={card}>
        <div style={cardHead}>Thông tin yêu cầu</div>
        <div style={{ ...cardBody, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--tx2)', marginBottom: 4 }}>
              Tiêu đề (title) <span style={{ color: 'var(--red-solid)' }}>*</span>
            </label>
            <input
              className="odm-input"
              type="text"
              placeholder="VD: Kiểm tra nhiệt mái nhà xưởng KCN Long Hậu"
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              style={{ height: 34 }}
            />
            {errors.title && (
              <div style={{ fontSize: 11.5, color: 'var(--red-fg)', marginTop: 4 }}>{errors.title}</div>
            )}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--tx2)', marginBottom: 4 }}>
              Mục đích (purpose)
            </label>
            <input
              className="odm-input"
              type="text"
              placeholder="VD: Phát hiện điểm nóng bất thường trước ngày 30/09"
              value={form.purpose}
              onChange={(e) => update('purpose', e.target.value)}
              style={{ height: 34 }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--tx2)', marginBottom: 4 }}>
              Ghi chú (note)
            </label>
            <input
              className="odm-input"
              type="text"
              placeholder="Ghi chú cho nhóm vận hành"
              style={{ height: 34 }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--tx2)', marginBottom: 4 }}>
              Mô tả (description)
            </label>
            <textarea
              className="odm-input"
              rows={3}
              placeholder="Mô tả khu vực, yêu cầu đặc biệt, hạng mục cần kiểm tra..."
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              style={{ resize: 'none', paddingTop: 8, lineHeight: 1.5, fontSize: 13 }}
            />
          </div>

          {/* File attachment placeholder */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--tx2)', marginBottom: 6 }}>
              Tệp đính kèm order_attachment
            </label>
            <div
              style={{
                border: '1.5px dashed var(--bd2)', borderRadius: 8,
                padding: '16px 12px', textAlign: 'center',
                fontSize: 12, color: 'var(--tx3)',
              }}
            >
              Kéo thả tệp vào đây
              <div style={{ marginTop: 4, fontSize: 11 }}>PDF, XLSX, PNG, KMZ · tối đa 20 MB</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Step 3: Thời gian và media ────────────────────────────
// Layout: Left = Calendar 330px | Right = timeslots + media table

function Step3Time({
  form, update, errors,
  calYear, calMonth, setCalYear, setCalMonth, today,
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
  const minDate = new Date(today)
  minDate.setDate(minDate.getDate() + 1)

  function isDisabled(day: number): boolean {
    return new Date(calYear, calMonth, day) < minDate
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
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 340px', gap: 14 }}>
      {/* ── Left: Calendar card ── */}
      <div style={card}>
        <div style={cardHead}>
          <span>Ngày và khung giờ</span>
          <span style={{ fontSize: 11.5, fontWeight: 400, color: 'var(--tx3)' }}>preferred_date · preferred_time</span>
        </div>
        <div style={{ ...cardBody }}>
          {/* Month navigation */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <button
              type="button"
              className="odm-btn odm-btn-gh"
              style={{ height: 28, padding: '0 10px', fontSize: 14 }}
              onClick={prevMonth}
            >
              ‹
            </button>
            <span style={{ fontWeight: 700, fontSize: 14 }}>{MONTH_NAMES[calMonth]}, {calYear}</span>
            <button
              type="button"
              className="odm-btn odm-btn-gh"
              style={{ height: 28, padding: '0 10px', fontSize: 14 }}
              onClick={nextMonth}
            >
              ›
            </button>
          </div>
          {/* Day of week headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 4 }}>
            {DAY_NAMES.map((d) => (
              <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: 'var(--tx3)', padding: '2px 0' }}>
                {d}
              </div>
            ))}
          </div>
          {/* Day cells */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3 }}>
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
                  title={disabled ? `Ngày đến ${fmtDateVi(iso)} bị khoá: cần đặt trước tối thiểu 24 giờ` : undefined}
                  style={{
                    height: 34, border: 'none', borderRadius: 6,
                    fontSize: 13, fontWeight: selected ? 700 : 400,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    background: selected ? 'var(--blue-solid)' : 'transparent',
                    color: selected ? '#fff' : disabled ? 'var(--tx3)' : 'var(--tx)',
                    opacity: disabled ? 0.35 : 1,
                  }}
                >
                  {day}
                </button>
              )
            })}
          </div>
          {form.preferredDate && (
            <div style={{ marginTop: 10, fontSize: 13, color: 'var(--green-fg)', fontWeight: 600 }}>
              ✓ Đã chọn: {fmtDateVi(form.preferredDate)}
            </div>
          )}
          {errors.preferredDate && (
            <div style={{ fontSize: 11.5, color: 'var(--red-fg)', marginTop: 6 }}>{errors.preferredDate}</div>
          )}
          {/* Timeslots */}
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--tx2)', marginBottom: 8 }}>
              Khung giờ mong muốn
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {TIME_SLOTS.map((slot) => {
                const active = form.preferredTimeId === slot.id
                return (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => update('preferredTimeId', slot.id)}
                    style={{
                      flex: 1, padding: '10px 12px', textAlign: 'left',
                      background: active ? 'var(--blue-bg)' : 'var(--sf)',
                      border: `1.5px solid ${active ? 'var(--blue-solid)' : 'var(--bd)'}`,
                      borderRadius: 8, cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: 13, color: active ? 'var(--blue-fg)' : 'var(--tx)' }}>
                      {slot.label}
                    </div>
                    <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: active ? 'var(--blue-dot)' : 'var(--tx3)', marginTop: 2 }}>
                      {slot.detail}
                    </div>
                  </button>
                )
              })}
            </div>
            <div style={{ marginTop: 8, fontSize: 11.5, color: 'var(--tx3)' }}>
              Chỉ hiển thị các khung giờ còn hiệu lực (preferred_time.effective_to).
            </div>
          </div>
        </div>
      </div>

      {/* ── Right: Media requirements card ── */}
      <div style={card}>
        <div style={cardHead}>
          Yêu cầu media
          <span style={{ fontSize: 11.5, fontWeight: 400, color: 'var(--tx3)' }}>order_media_requirement</span>
        </div>
        <div style={{ ...cardBody, display: 'flex', flexDirection: 'column', gap: 0 }}>
          {/* Table header */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '100px 70px 1fr',
              gap: 0, padding: '7px 0',
              borderBottom: '1px solid var(--bd)',
              fontSize: 11.5, fontWeight: 600, color: 'var(--tx3)',
            }}
          >
            <span>Loại</span>
            <span>Số lượng</span>
            <span>Độ phân giải</span>
          </div>
          {(['VIDEO', 'PHOTO', 'LIVESTREAM'] as const).map((type) => (
            <div
              key={type}
              style={{
                display: 'grid',
                gridTemplateColumns: '100px 70px 1fr',
                gap: 0, padding: '8px 0',
                borderBottom: '1px solid var(--bd)',
                alignItems: 'center',
                fontSize: 12,
              }}
            >
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 11 }}>{type}</span>
              <select
                className="odm-input"
                style={{ height: 28, fontSize: 11, padding: '0 6px' }}
                aria-label={`${type} số lượng`}
                defaultValue=""
              >
                <option value="">—</option>
                {[1, 2, 3, 5].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
              <select
                className="odm-input"
                style={{ height: 28, fontSize: 11, padding: '0 6px' }}
                aria-label={`${type} độ phân giải`}
                defaultValue=""
              >
                <option value="">—</option>
                <option value="4K">4K</option>
                <option value="1080p">1080p</option>
                <option value="20MP">20 MP</option>
                <option value="640x512">640×512</option>
              </select>
            </div>
          ))}
          <button
            type="button"
            className="odm-btn odm-btn-gh"
            style={{ marginTop: 8, fontSize: 12, height: 28, alignSelf: 'flex-start' }}
          >
            + Thêm
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Step 4: Xem lại và phân tích ──────────────────────────
// Layout: Left = mini map + summary | Right = review card 360px

function Step4Review({ form }: { form: FormState }) {
  const slotDef = TIME_SLOTS.find((t) => t.id === form.preferredTimeId)
  const selectedServices = SERVICES.filter((s) => form.serviceIds.includes(s.id))
  const circleR = Math.max(16, Math.min(100, form.radiusM / 8))

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 360px', gap: 14 }}>
      {/* ── Left: mini map + flight time card ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Mini map */}
        <div
          style={{
            ...card,
            position: 'relative', height: 240, overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', inset: 0, background: 'var(--map-bg)' }} />
          {[168, 347].map((y) => (
            <div key={y} style={{ position: 'absolute', left: 0, right: 0, top: y * 0.43, height: 8, background: 'var(--map-road2)' }} />
          ))}
          {[224, 528].map((x) => (
            <div key={x} style={{ position: 'absolute', top: 0, bottom: 0, left: x * 0.43, width: 8, background: 'var(--map-road2)' }} />
          ))}
          <div
            style={{
              position: 'absolute', left: '50%', top: '50%',
              width: circleR * 2, height: circleR * 2,
              transform: 'translate(-50%, -50%)',
              borderRadius: '50%',
              border: '2px solid var(--blue-solid)',
              background: 'rgba(31,111,214,.12)',
            }}
          />
          <div
            style={{
              position: 'absolute', left: '50%', top: '50%',
              transform: 'translate(-50%, -50%)',
              width: 10, height: 10, borderRadius: '50%',
              background: 'var(--blue-solid)', border: '2px solid #fff',
            }}
          />
          {/* Address label */}
          {form.addressText && (
            <div
              style={{
                position: 'absolute', bottom: 10, left: 10, right: 10,
                background: 'var(--sf)', borderRadius: 6, padding: '5px 8px',
                fontSize: 12, color: 'var(--tx2)',
                border: '1px solid var(--bd)',
              }}
            >
              {form.addressText}
            </div>
          )}
        </div>

        {/* Summary rows */}
        <div style={card}>
          <div style={cardHead}>Tóm tắt yêu cầu</div>
          <div style={{ ...cardBody, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Địa chỉ', value: form.addressText || '—' },
              { label: 'Bán kính', value: `${form.radiusM} m (${calcArea(form.radiusM)})`, mono: true },
              { label: 'Ngày bay', value: form.preferredDate ? fmtDateVi(form.preferredDate) : '—' },
              { label: 'Khung giờ', value: slotDef ? `${slotDef.label} ${slotDef.detail}` : '—' },
            ].map(({ label, value, mono }) => (
              <div key={label} style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: 8, fontSize: 13 }}>
                <span style={{ color: 'var(--tx3)' }}>{label}</span>
                <span style={{ fontWeight: 500, fontFamily: mono ? 'var(--font-mono)' : undefined, fontSize: mono ? 12 : undefined }}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right: review card ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Services summary */}
        <div style={card}>
          <div style={cardHead}>
            Dịch vụ đã chọn
            <span style={{ fontSize: 11.5, fontWeight: 600, padding: '1px 7px', borderRadius: 10, background: 'var(--blue-bg)', color: 'var(--blue-fg)' }}>
              {selectedServices.length}
            </span>
          </div>
          <div style={{ ...cardBody, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {selectedServices.length === 0 ? (
              <span style={{ color: 'var(--tx3)', fontSize: 13 }}>Chưa chọn dịch vụ</span>
            ) : (
              selectedServices.map((s) => (
                <div key={s.id} style={{ fontSize: 13, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--green-solid)', marginTop: 2 }}>✓</span>
                  <div>
                    <div style={{ fontWeight: 600 }}>{s.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--tx3)', marginTop: 2 }}>
                      {s.sensors.join(' · ')} · ~{s.durationMin} phút
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Info summary */}
        <div style={card}>
          <div style={cardHead}>Thông tin yêu cầu</div>
          <div style={{ ...cardBody, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'Tiêu đề', value: form.title || '—' },
              { label: 'Mục đích', value: form.purpose || '—' },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 8, fontSize: 13 }}>
                <span style={{ color: 'var(--tx3)' }}>{label}</span>
                <span style={{ fontWeight: 500 }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* AI note */}
        <div
          style={{
            background: 'var(--blue-bg)', border: '1px solid var(--blue-dot)',
            borderRadius: 10, padding: '14px 16px', fontSize: 13,
          }}
        >
          <div style={{ fontWeight: 700, color: 'var(--blue-fg)', marginBottom: 6 }}>
            🔍 Phân tích tính khả thi
          </div>
          <div style={{ color: 'var(--blue-fg)', lineHeight: 1.6 }}>
            AI sẽ kiểm tra thời gian, vùng cấm bay, năng lực drone, nguồn lực và an toàn. Kết quả trả về ngay sau khi nhấn nút.
          </div>
        </div>
      </div>
    </div>
  )
}
