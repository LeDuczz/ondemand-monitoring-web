import { useState, type FormEvent } from 'react'

import { ApiError } from '../../../../../shared/api/httpClient'
import { useI18n } from '../../../../../shared/i18n'
import {
  BE_USER_ROLES,
  adminUsersApi,
  type ManagedAccountResponse,
  type ManagedUserRole,
} from '../../../api/adminUsersApi'
import { Modal } from '../../../components/common/Modal'
import { RoleBadge } from '../../../components/common/RoleBadge'
import { createUserModalMessages } from './CreateUserModal.messages'

// CUSTOMER accounts self-register; admins only create internal accounts.
const CREATABLE_ROLES = BE_USER_ROLES.filter((r) => r !== 'CUSTOMER')

type FormErrors = Partial<Record<'fullName' | 'email', string>>

export function CreateUserModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (result: ManagedAccountResponse) => void
}) {
  const { t } = useI18n(createUserModalMessages)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<ManagedUserRole>('STAFF')
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  function validate(): boolean {
    const next: FormErrors = {}
    if (!fullName.trim()) next.fullName = t.required
    if (!email.trim()) next.email = t.required
    else if (!/^\S+@\S+\.\S+$/.test(email.trim())) next.email = t.invalidEmail
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const result = await adminUsersApi.createAccount({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        role,
      })
      onCreated(result)
    } catch (err) {
      if (err instanceof ApiError && err.errors) {
        setErrors({ fullName: err.errors.fullName, email: err.errors.email })
      }
      setSubmitError(err instanceof Error ? err.message : t.genericError)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      width={520}
      icon="plus"
      title={t.title}
      subtitle={t.subtitle}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="odm-btn odm-btn-gh" onClick={onClose}>
            {t.cancel}
          </button>
          <button
            type="submit"
            form="adm-create-user-form"
            className="odm-btn odm-btn-p"
            disabled={submitting}
          >
            {submitting ? t.sending : t.submit}
          </button>
        </>
      }
    >
      <form id="adm-create-user-form" onSubmit={handleSubmit} noValidate>
        <div className="adm-form-field">
          <label htmlFor="adm-cu-name" className="adm-label">
            {t.fullName} <span className="adm-required">*</span>
          </label>
          <input
            id="adm-cu-name"
            className="odm-inp"
            type="text"
            placeholder={t.fullNamePlaceholder}
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value)
              setErrors((p) => ({ ...p, fullName: undefined }))
            }}
            aria-invalid={!!errors.fullName}
          />
          {errors.fullName && (
            <div className="adm-field-error">{errors.fullName}</div>
          )}
        </div>
        <div className="adm-form-field">
          <label htmlFor="adm-cu-email" className="adm-label">
            {t.email} <span className="adm-required">*</span>
          </label>
          <input
            id="adm-cu-email"
            className="odm-inp"
            type="email"
            placeholder="name@company.vn"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setErrors((p) => ({ ...p, email: undefined }))
            }}
            aria-invalid={!!errors.email}
          />
          {errors.email && <div className="adm-field-error">{errors.email}</div>}
        </div>
        <div className="adm-form-field">
          <span className="adm-label">{t.role}</span>
          <div className="adm-choice-grid">
            {CREATABLE_ROLES.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`adm-choice${role === r ? ' is-selected' : ''}`}
                aria-pressed={role === r}
              >
                <span className="adm-choice-radio" aria-hidden="true" />
                <span className="adm-choice-text">
                  <span>
                    <RoleBadge role={r} />
                  </span>
                  <small>{t.roleDescriptions[r]}</small>
                </span>
              </button>
            ))}
          </div>
        </div>
        {submitError && (
          <div role="alert" className="adm-alert is-danger">
            {submitError}
          </div>
        )}
      </form>
    </Modal>
  )
}
