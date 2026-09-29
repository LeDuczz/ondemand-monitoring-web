import { useState } from 'react'

import { adminUsersApi, type ManagedUserRole } from '../api/adminUsersApi'
import { getRoleLabel } from '../lib/accountStatus'
import { useI18n } from '../../../shared/i18n'
import { adminHref } from '../routes'
import { createAccountPageMessages } from './CreateAccountPage.messages'

type EmployeeRole = Exclude<ManagedUserRole, 'CUSTOMER' | 'ADMIN'>

const EMPLOYEE_ROLE_VALUES = [
  'STAFF',
  'DRONE_OPERATOR',
  'SYSTEM_OPERATOR',
] as const satisfies readonly EmployeeRole[]

type FormErrors = Partial<Record<'fullName' | 'email' | 'role', string>>

export function CreateAccountPage() {
  const { t, lang } = useI18n(createAccountPageMessages)
  const EMPLOYEE_ROLES: Array<{ value: EmployeeRole; description: string }> =
    EMPLOYEE_ROLE_VALUES.map((value) => ({
      value,
      description: t.roleDescriptions[value],
    }))
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<EmployeeRole>('STAFF')
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [createdEmail, setCreatedEmail] = useState<string | null>(null)

  function validate(): boolean {
    const errs: FormErrors = {}
    if (!fullName.trim()) errs.fullName = t.required
    if (!email.trim()) {
      errs.email = t.required
    } else if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      errs.email = t.invalidEmail
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
      await adminUsersApi.createAccount({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        role,
      })
      setCreatedEmail(email.trim().toLowerCase())
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t.genericError
      setSubmitError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  if (createdEmail) {
    return (
      <div style={{ maxWidth: 520, margin: '60px auto', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
        <h2 style={{ margin: '0 0 8px' }}>{t.createdTitle}</h2>
        <p style={{ color: 'var(--tx3)', marginBottom: 24 }}>
          {t.createdDescriptionPrefix} <strong>{createdEmail}</strong>
          {t.createdDescriptionSuffix}
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <a
            href={adminHref({ screen: 'accounts' })}
            className="odm-btn odm-btn-p"
          >
            {t.viewList}
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
            {t.createAnother}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ marginBottom: 20, fontSize: 13, color: 'var(--tx3)' }}>
        <a
          href={adminHref({ screen: 'accounts' })}
          style={{ color: 'var(--tx3)', textDecoration: 'none' }}
        >
          {t.backToAccounts}
        </a>
      </div>

      <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700 }}>
        {t.pageTitle}
      </h1>
      <p style={{ margin: '0 0 24px', color: 'var(--tx3)', fontSize: 13 }}>
        {t.pageSubtitle}
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
          <h2 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600 }}>
            {t.personalInfo}
          </h2>

          <div style={{ marginBottom: 14 }}>
            <label
              htmlFor="adm-fullname"
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 4,
              }}
            >
              {t.fullName} <span style={{ color: 'var(--red-solid)' }}>*</span>
            </label>
            <input
              id="adm-fullname"
              className="odm-input"
              type="text"
              placeholder={t.fullNamePlaceholder}
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value)
                setErrors((prev) => ({ ...prev, fullName: undefined }))
              }}
              aria-invalid={!!errors.fullName}
            />
            {errors.fullName && (
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--red-solid)',
                  marginTop: 4,
                }}
              >
                {errors.fullName}
              </div>
            )}
          </div>

          <div>
            <label
              htmlFor="adm-email"
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 4,
              }}
            >
              {t.workEmail} <span style={{ color: 'var(--red-solid)' }}>*</span>
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
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--red-solid)',
                  marginTop: 4,
                }}
              >
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
          <h2 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600 }}>
            {t.role}
          </h2>
          <p style={{ margin: '0 0 14px', fontSize: 12, color: 'var(--tx3)' }}>
            {t.roleHint}
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
                    {getRoleLabel(r.value, lang)}
                  </strong>
                  <small style={{ fontSize: 12, color: 'var(--tx3)' }}>
                    {r.description}
                  </small>
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
          <button
            type="submit"
            className="odm-btn odm-btn-p"
            disabled={submitting}
          >
            {submitting ? t.sending : t.sendInvite}
          </button>
          <a
            href={adminHref({ screen: 'accounts' })}
            className="odm-btn odm-btn-gh"
          >
            {t.cancel}
          </a>
        </div>
      </form>
    </div>
  )
}
