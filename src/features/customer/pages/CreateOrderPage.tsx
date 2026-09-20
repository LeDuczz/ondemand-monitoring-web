import { useState } from 'react'

import { customerApi, type CreateOrderPayload } from '../api/customerApi'
import { customerHref } from '../routes'

type Step = 1 | 2 | 3

type FormState = {
  title: string
  purpose: string
  description: string
  addressText: string
  preferredDate: string
  preferredTimeName: string
}

const TIME_SLOTS = [
  'Sáng sớm 06:00–08:00',
  'Sáng 08:00–12:00',
  'Chiều 13:00–17:00',
  'Chiều tối 17:00–19:00',
]

const SERVICES = [
  { id: 'svc-survey', label: 'Khảo sát công trình' },
  { id: 'svc-infra', label: 'Giám sát hạ tầng' },
  { id: 'svc-thermal', label: 'Nhiệt ảnh' },
  { id: 'svc-damage', label: 'Đánh giá thiệt hại' },
  { id: 'svc-agri', label: 'Nông nghiệp' },
  { id: 'svc-storage', label: 'Quản lý kho bãi' },
]

const STEP_LABELS: Record<Step, string> = {
  1: '1. Thông tin cơ bản',
  2: '2. Thời gian & địa điểm',
  3: '3. Xác nhận',
}

export function CreateOrderPage() {
  const [step, setStep] = useState<Step>(1)
  const [form, setForm] = useState<FormState>({
    title: '',
    purpose: '',
    description: '',
    addressText: '',
    preferredDate: '',
    preferredTimeName: TIME_SLOTS[1],
  })
  const [selectedService, setSelectedService] = useState<string>('')
  const [errors, setErrors] = useState<Partial<Record<keyof FormState | 'service', string>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [createdId, setCreatedId] = useState<string | null>(null)

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  function validateStep1(): boolean {
    const errs: typeof errors = {}
    if (!form.title.trim()) errs.title = 'Bắt buộc'
    if (!selectedService) errs.service = 'Vui lòng chọn dịch vụ'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function validateStep2(): boolean {
    const errs: typeof errors = {}
    if (!form.addressText.trim()) errs.addressText = 'Bắt buộc'
    if (!form.preferredDate) errs.preferredDate = 'Bắt buộc'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleNext() {
    if (step === 1 && !validateStep1()) return
    if (step === 2 && !validateStep2()) return
    if (step < 3) setStep((s) => (s + 1) as Step)
  }

  async function handleSubmit() {
    setSubmitting(true)
    setSubmitError(null)
    try {
      const payload: CreateOrderPayload = {
        title: form.title.trim(),
        purpose: form.purpose.trim() || undefined,
        description: form.description.trim() || undefined,
        serviceIds: selectedService ? [selectedService] : [],
        addressText: form.addressText.trim(),
        centerLat: 0,
        centerLon: 0,
        radiusM: 300,
        preferredDate: form.preferredDate,
        preferredTimeName: form.preferredTimeName,
      }
      const result = await customerApi.createOrder(payload)
      setCreatedId(result.id)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Có lỗi xảy ra. Vui lòng thử lại.'
      setSubmitError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  // Success state
  if (createdId) {
    return (
      <div style={{ maxWidth: 540, margin: '60px auto', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
        <h2 style={{ margin: '0 0 8px' }}>Đơn đã được gửi thành công!</h2>
        <p style={{ color: 'var(--tx3)', marginBottom: 24 }}>
          Chúng tôi sẽ xem xét và phản hồi trong 1–2 ngày làm việc.
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <a
            href={customerHref({ screen: 'orderDetail', orderId: createdId })}
            className="odm-btn odm-btn-p"
          >
            Xem đơn hàng
          </a>
          <a
            href={customerHref({ screen: 'createOrder' })}
            className="odm-btn odm-btn-gh"
            onClick={() => {
              setCreatedId(null)
              setStep(1)
              setForm({
                title: '',
                purpose: '',
                description: '',
                addressText: '',
                preferredDate: '',
                preferredTimeName: TIME_SLOTS[1],
              })
              setSelectedService('')
            }}
          >
            Tạo đơn khác
          </a>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 640 }}>
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

      {/* Wizard steps */}
      <div className="odm-cus-wizard-steps" style={{ marginBottom: 24 }}>
        {([1, 2, 3] as Step[]).map((s) => (
          <div
            key={s}
            className={`odm-cus-wizard-step ${step === s ? 'active' : step > s ? 'done' : ''}`}
          >
            {STEP_LABELS[s]}
          </div>
        ))}
      </div>

      {/* Step 1: Basic info */}
      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label
              htmlFor="cus-title"
              style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}
            >
              Tiêu đề yêu cầu <span style={{ color: 'var(--red-solid)' }}>*</span>
            </label>
            <input
              id="cus-title"
              className="odm-input"
              type="text"
              placeholder="VD: Khảo sát mặt bằng kho Cát Lái"
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              aria-invalid={!!errors.title}
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
              style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}
            >
              Mục đích
            </label>
            <input
              id="cus-purpose"
              className="odm-input"
              type="text"
              placeholder="VD: Kiểm tra tiến độ xây dựng"
              value={form.purpose}
              onChange={(e) => update('purpose', e.target.value)}
            />
          </div>

          <div>
            <label
              style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}
            >
              Loại dịch vụ <span style={{ color: 'var(--red-solid)' }}>*</span>
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {SERVICES.map((svc) => (
                <button
                  key={svc.id}
                  type="button"
                  className={`odm-btn ${selectedService === svc.id ? 'odm-btn-p' : 'odm-btn-gh'}`}
                  onClick={() => {
                    setSelectedService(svc.id)
                    setErrors((e) => ({ ...e, service: undefined }))
                  }}
                >
                  {svc.label}
                </button>
              ))}
            </div>
            {errors.service && (
              <div style={{ fontSize: 12, color: 'var(--red-solid)', marginTop: 4 }}>
                {errors.service}
              </div>
            )}
          </div>

          <div>
            <label
              htmlFor="cus-desc"
              style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}
            >
              Mô tả chi tiết
            </label>
            <textarea
              id="cus-desc"
              className="odm-input"
              rows={4}
              placeholder="Mô tả khu vực, yêu cầu đặc biệt..."
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>
        </div>
      )}

      {/* Step 2: Time & location */}
      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label
              htmlFor="cus-address"
              style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}
            >
              Địa điểm <span style={{ color: 'var(--red-solid)' }}>*</span>
            </label>
            <input
              id="cus-address"
              className="odm-input"
              type="text"
              placeholder="VD: KCN Cát Lái, Quận 2, TP.HCM"
              value={form.addressText}
              onChange={(e) => update('addressText', e.target.value)}
              aria-invalid={!!errors.addressText}
            />
            {errors.addressText && (
              <div style={{ fontSize: 12, color: 'var(--red-solid)', marginTop: 4 }}>
                {errors.addressText}
              </div>
            )}
          </div>

          <div>
            <label
              htmlFor="cus-date"
              style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}
            >
              Ngày bay mong muốn <span style={{ color: 'var(--red-solid)' }}>*</span>
            </label>
            <input
              id="cus-date"
              className="odm-input"
              type="date"
              value={form.preferredDate}
              onChange={(e) => update('preferredDate', e.target.value)}
              aria-invalid={!!errors.preferredDate}
            />
            {errors.preferredDate && (
              <div style={{ fontSize: 12, color: 'var(--red-solid)', marginTop: 4 }}>
                {errors.preferredDate}
              </div>
            )}
          </div>

          <div>
            <label
              style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}
            >
              Khung giờ mong muốn
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {TIME_SLOTS.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  className={`odm-btn ${form.preferredTimeName === slot ? 'odm-btn-p' : 'odm-btn-gh'}`}
                  onClick={() => update('preferredTimeName', slot)}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Confirm */}
      {step === 3 && (
        <div>
          <div
            style={{
              background: 'var(--sf)',
              border: '1px solid var(--bd)',
              borderRadius: 10,
              padding: '16px 20px',
              marginBottom: 16,
            }}
          >
            <h2 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600 }}>
              Xác nhận thông tin
            </h2>
            <div className="odm-cus-detail-grid">
              <div>
                <div className="odm-cus-detail-label">Tiêu đề</div>
                <div className="odm-cus-detail-value">{form.title}</div>
              </div>
              <div>
                <div className="odm-cus-detail-label">Dịch vụ</div>
                <div className="odm-cus-detail-value">
                  {SERVICES.find((s) => s.id === selectedService)?.label ?? '—'}
                </div>
              </div>
              <div>
                <div className="odm-cus-detail-label">Địa điểm</div>
                <div className="odm-cus-detail-value">{form.addressText}</div>
              </div>
              <div>
                <div className="odm-cus-detail-label">Ngày & giờ</div>
                <div className="odm-cus-detail-value">
                  {form.preferredDate} · {form.preferredTimeName}
                </div>
              </div>
              {form.purpose && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <div className="odm-cus-detail-label">Mục đích</div>
                  <div className="odm-cus-detail-value">{form.purpose}</div>
                </div>
              )}
              {form.description && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <div className="odm-cus-detail-label">Mô tả chi tiết</div>
                  <div style={{ fontSize: 13 }}>{form.description}</div>
                </div>
              )}
            </div>
          </div>

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
        </div>
      )}

      {/* Navigation buttons */}
      <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
        {step > 1 && (
          <button
            type="button"
            className="odm-btn odm-btn-gh"
            onClick={() => setStep((s) => (s - 1) as Step)}
          >
            ← Quay lại
          </button>
        )}
        <div style={{ flex: 1 }} />
        {step < 3 ? (
          <button type="button" className="odm-btn odm-btn-p" onClick={handleNext}>
            Tiếp theo →
          </button>
        ) : (
          <button
            type="button"
            className="odm-btn odm-btn-p"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
          </button>
        )}
      </div>
    </div>
  )
}
