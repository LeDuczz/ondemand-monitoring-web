import { useState } from 'react'

import { adminUsersApi, type ManagedUserRole } from '../api/adminUsersApi'
import { getRoleLabel } from '../lib/accountStatus'
import { useI18n } from '../../../shared/i18n'
import { adminHref } from '../routes'
import { createAccountPageMessages } from './CreateAccountPage.messages'
import { Card } from '../components/common/Card'
import { PageHeader } from '../components/common/PageHeader'

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
    <div className="adm-narrow">
      <PageHeader
        back={<a href={adminHref({ screen: 'accounts' })}>{t.backToAccounts}</a>}
        title={t.pageTitle}
        subtitle={t.pageSubtitle}
      />

      <form onSubmit={handleSubmit} noValidate>
        <Card title={t.personalInfo}>
          <div className="adm-form-field">
            <label htmlFor="adm-fullname" className="adm-label">
              {t.fullName} <span className="adm-required">*</span>
            </label>
            <input
              id="adm-fullname"
              className="odm-inp"
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
              <div className="adm-field-error">{errors.fullName}</div>
            )}
          </div>

          <div className="adm-form-field">
            <label htmlFor="adm-email" className="adm-label">
              {t.workEmail} <span className="adm-required">*</span>
            </label>
            <input
              id="adm-email"
              className="odm-inp"
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
              <div className="adm-field-error">{errors.email}</div>
            )}
          </div>
        </Card>

        {/* Role selection */}
        <Card title={t.role}>
          <p className="adm-card-hint">{t.roleHint}</p>
          <div className="adm-choice-list">
            {EMPLOYEE_ROLES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                className={`adm-choice${role === r.value ? ' is-selected' : ''}`}
                aria-pressed={role === r.value}
              >
                <span className="adm-choice-radio" aria-hidden="true" />
                <span className="adm-choice-text">
                  <strong>{getRoleLabel(r.value, lang)}</strong>
                  <small>{r.description}</small>
                </span>
              </button>
            ))}
          </div>
        </Card>

        {submitError && (
          <div role="alert" className="adm-alert is-danger">
            {submitError}
          </div>
        )}

        <div className="adm-row">
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
