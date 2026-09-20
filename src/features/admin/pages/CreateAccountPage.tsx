import { useState } from 'react'

import { adminApi } from '../api/adminApi'
import { ROLE_LABEL } from '../lib/accountStatus'
import { adminHref } from '../routes'
import type { UserRole } from '../../auth/types'

type EmployeeRole = Exclude<UserRole, 'CUSTOMER' | 'ADMIN'>

const EMPLOYEE_ROLES: Array<{ value: EmployeeRole; description: string }> = [
  { value: 'STAFF', description: 'Duyệt đơn, điều phối mission, giao kết quả.' },
  { value: 'DRONE_OPERATOR', description: 'Thực hiện bay, ghi nhận dữ liệu mission.' },
  { value: 'SYSTEM_OPERATOR', description: 'Giám sát thiết bị, telemetry, cảnh báo hệ thống.' },
]

type FormErrors = Partial<Record<'fullName' | 'email' | 'role', string>>

export function CreateAccountPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<EmployeeRole>('STAFF')
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [createdEmail, setCreatedEmail] = useState<string | null>(null)

  function validate(): boolean {
    const errs: FormErrors = {}
    if (!fullName.trim()) errs.fullName = 'Bắt buộc'
    if (!email.trim()) {
      errs.email = 'Bắt buộc'
    } else if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      errs.email = 'Email không hợp lệ'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      await adminApi.createAccount({ fullName: fullName.trim(), email: email.trim().toLowerCase(), role })
      setCreatedEmail(email.trim().toLowerCase())
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Có lỗi xảy ra.'
      setSubmitError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  if (createdEmail) {
    return (
      <div style={{ maxWidth: 520, margin: '60px auto', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
        <h2 style={{ margin: '0 0 8px' }}>Tài khoản đã được tạo!</h2>
        <p style={{ color: 'var(--tx3)', marginBottom: 24 }}>
          Lời mời đã gửi đến <strong>{createdEmail}</strong>. Nhân viên cần đổi mật khẩu khi đăng nhập lần đầu.
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <a href={adminHref({ screen: 'accounts' })} className="odm-btn odm-btn-p">
            Xem danh sách
          </a>
          <button
            type="button"
            className="odm-btn odm-btn-gh"
            onClick={() => {
              setCreatedEmail(null)
              setFullName('')
              setEmail('')
              setRole('STAFF')
              setErrors({})
            }}
          >
            Tạo tài khoản khác
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ marginBottom: 20, fontSize: 13, color: 'var(--tx3)' }}>
        <a href={adminHref({ screen: 'accounts' })} style={{ color: 'var(--tx3)', textDecoration: 'none' }}>
          ← Tài khoản
        </a>
      </div>

      <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700 }}>Tạo tài khoản nhân viên</h1>
      <p style={{ margin: '0 0 24px', color: 'var(--tx3)', fontSize: 13 }}>
        Hệ thống sẽ gửi lời mời qua email. Admin không cần nhập mật khẩu.
      </p>

      <form onSubmit={handleSubmit} noValidate>
        <div
          style={{
            background: 'var(--sf)',
            border: '1px solid var(--bd)',
            borderRadius: 10,
            padding: '20px 24px',
            marginBottom: 16,
          }}
        >
          <h2 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600 }}>Thông tin cá nhân</h2>

          <div style={{ marginBottom: 14 }}>
            <label
              htmlFor="adm-fullname"
              style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}
            >
              Họ và tên <span style={{ color: 'var(--red-solid)' }}>*</span>
            </label>
            <input
              id="adm-fullname"
              className="odm-input"
              type="text"
              placeholder="VD: Nguyễn Văn A"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value)
                setErrors((prev) => ({ ...prev, fullName: undefined }))
              }}
              aria-invalid={!!errors.fullName}
            />
            {errors.fullName && (
              <div style={{ fontSize: 12, color: 'var(--red-solid)', marginTop: 4 }}>
                {errors.fullName}
              </div>
            )}
          </div>

          <div>
            <label
              htmlFor="adm-email"
              style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}
            >
              Email công việc <span style={{ color: 'var(--red-solid)' }}>*</span>
            </label>
            <input
              id="adm-email"
              className="odm-input"
              type="email"
              placeholder="name@company.vn"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setErrors((prev) => ({ ...prev, email: undefined }))
              }}
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <div style={{ fontSize: 12, color: 'var(--red-solid)', marginTop: 4 }}>
                {errors.email}
              </div>
            )}
          </div>
        </div>

        {/* Role selection */}
        <div
          style={{
            background: 'var(--sf)',
            border: '1px solid var(--bd)',
            borderRadius: 10,
            padding: '20px 24px',
            marginBottom: 16,
          }}
        >
          <h2 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600 }}>Vai trò</h2>
          <p style={{ margin: '0 0 14px', fontSize: 12, color: 'var(--tx3)' }}>
            Vai trò quyết định không gian làm việc và quyền hạn sau khi đăng nhập.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {EMPLOYEE_ROLES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  padding: '10px 14px',
                  border: `2px solid ${role === r.value ? 'var(--ink)' : 'var(--bd)'}`,
                  borderRadius: 8,
                  background: role === r.value ? 'var(--sf2)' : 'transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                }}
                aria-pressed={role === r.value}
              >
                <span
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    border: `2px solid ${role === r.value ? 'var(--ink)' : 'var(--bd)'}`,
                    marginTop: 2,
                    flex: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {role === r.value && (
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: 'var(--ink)',
                      }}
                    />
                  )}
                </span>
                <span>
                  <strong style={{ display: 'block', fontSize: 13 }}>
                    {ROLE_LABEL[r.value]}
                  </strong>
                  <small style={{ fontSize: 12, color: 'var(--tx3)' }}>{r.description}</small>
                </span>
              </button>
            ))}
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
              marginBottom: 14,
              fontSize: 13,
              color: 'var(--red-solid)',
            }}
          >
            {submitError}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit" className="odm-btn odm-btn-p" disabled={submitting}>
            {submitting ? 'Đang gửi...' : 'Gửi lời mời →'}
          </button>
          <a href={adminHref({ screen: 'accounts' })} className="odm-btn odm-btn-gh">
            Huỷ
          </a>
        </div>
      </form>
    </div>
  )
}
