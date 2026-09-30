import { useState, type FormEvent } from 'react'

import { Button } from '../../../shared/components/Button'
import { Icon } from '../../../shared/components/Icon'
import { PortalLayout } from '../../../shared/components/portal/PortalLayout'
import { AuthApiError, authApi, authSession } from '../../auth/api/authApi'
import type { EmployeeRole } from '../../auth/types'

const employeeRoles: Array<{
  value: EmployeeRole
  label: string
  description: string
}> = [
  {
    value: 'STAFF',
    label: 'Staff',
    description:
      'Review requests, coordinate assignments, and follow service delivery.',
  },
  {
    value: 'DRONE_OPERATOR',
    label: 'Drone operator',
    description: 'Run assigned remote inspections and submit mission evidence.',
  },
  {
    value: 'SYSTEM_OPERATOR',
    label: 'System operator',
    description:
      'Monitor devices, telemetry, system health, and operational alerts.',
  },
]

const roleLabels: Record<EmployeeRole, string> = {
  STAFF: 'Staff',
  DRONE_OPERATOR: 'Drone operator',
  SYSTEM_OPERATOR: 'System operator',
  AUDITOR: 'Auditor',
}

type FormErrors = Partial<Record<'email' | 'fullName' | 'role', string>>

function validateForm(
  fullName: string,
  email: string,
  role: EmployeeRole,
): FormErrors {
  const errors: FormErrors = {}
  if (!fullName.trim()) errors.fullName = 'Enter the employee’s full name.'
  if (!email.trim()) {
    errors.email = 'Enter a work email address.'
  } else if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
    errors.email = 'Enter a valid work email address.'
  }
  if (!role) errors.role = 'Choose an employee role.'
  return errors
}

export function AdminAccountCreatePage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<EmployeeRole>('STAFF')
  const [errors, setErrors] = useState<FormErrors>({})
  const [notice, setNotice] = useState<string>()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setNotice(undefined)
    const nextErrors = validateForm(fullName, email, role)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const token = authSession.getAccessToken()
    if (!token) {
      setNotice('Your admin session has expired. Sign in again to continue.')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await authApi.createManagedAccount(
        { email: email.trim().toLowerCase(), fullName: fullName.trim(), role },
        token,
      )
      setNotice(
        `${response.email} was invited as ${roleLabels[response.role]}. The employee must set a password before signing in.`,
      )
      setFullName('')
      setEmail('')
      setRole('STAFF')
      setErrors({})
    } catch (error) {
      if (error instanceof AuthApiError) {
        setErrors((error.errors ?? {}) as FormErrors)
        setNotice(error.message)
      } else {
        setNotice('Unable to create the account. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <PortalLayout
      role="ADMIN"
      title="Create an employee account"
      subtitle="Invite a trusted team member to the right operational workspace."
    >
      <div className="admin-account-page">
        <a className="portal-back-link" href="#portal/admin">
          <Icon name="arrow-left" />
          Back to admin overview
        </a>
        <div className="admin-account-grid">
          <section
            className="portal-panel admin-account-card"
            aria-labelledby="account-form-title"
          >
            <div className="portal-panel-heading">
              <div>
                <p className="eyebrow">Employee provisioning</p>
                <h2 id="account-form-title">Invite a team member</h2>
              </div>
              <span className="admin-account-icon" aria-hidden="true">
                <Icon name="users" />
              </span>
            </div>
            <p className="admin-account-intro">
              Fieldwise will create the account and send an invitation. No
              password is entered or stored by the administrator.
            </p>
            <form
              className="admin-account-form"
              onSubmit={handleSubmit}
              noValidate
            >
              <div className="auth-field">
                <label htmlFor="managed-full-name">Full name</label>
                <input
                  id="managed-full-name"
                  name="fullName"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  autoComplete="name"
                  placeholder="e.g. Linh Nguyen"
                  aria-invalid={Boolean(errors.fullName)}
                  aria-describedby={
                    errors.fullName ? 'managed-full-name-error' : undefined
                  }
                  maxLength={100}
                  required
                />
                {errors.fullName ? (
                  <p
                    id="managed-full-name-error"
                    className="field-error"
                    role="alert"
                  >
                    {errors.fullName}
                  </p>
                ) : null}
              </div>
              <div className="auth-field">
                <label htmlFor="managed-email">Work email</label>
                <input
                  id="managed-email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  placeholder="name@company.com"
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={
                    errors.email ? 'managed-email-error' : undefined
                  }
                  required
                />
                {errors.email ? (
                  <p
                    id="managed-email-error"
                    className="field-error"
                    role="alert"
                  >
                    {errors.email}
                  </p>
                ) : null}
              </div>
              <div className="auth-field">
                <label htmlFor="managed-role">Workspace role</label>
                <select
                  id="managed-role"
                  name="role"
                  value={role}
                  onChange={(event) =>
                    setRole(event.target.value as EmployeeRole)
                  }
                  aria-invalid={Boolean(errors.role)}
                  aria-describedby={
                    errors.role ? 'managed-role-error' : 'managed-role-help'
                  }
                  required
                >
                  {employeeRoles.map((employeeRole) => (
                    <option key={employeeRole.value} value={employeeRole.value}>
                      {employeeRole.label}
                    </option>
                  ))}
                </select>
                <span
                  id="managed-role-help"
                  className="admin-account-field-help"
                >
                  The role controls the workspaces and permissions available
                  after sign-in.
                </span>
                {errors.role ? (
                  <p
                    id="managed-role-error"
                    className="field-error"
                    role="alert"
                  >
                    {errors.role}
                  </p>
                ) : null}
              </div>
              {notice ? (
                <div className="admin-account-notice" role="status">
                  <Icon name="check" />
                  <span>{notice}</span>
                </div>
              ) : null}
              <div className="admin-account-actions">
                <Button
                  type="submit"
                  icon="arrow-right"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Sending invitation…' : 'Send invitation'}
                </Button>
                <a className="button button--ghost" href="#portal/admin">
                  Cancel
                </a>
              </div>
            </form>
          </section>

          <aside
            className="admin-account-side"
            aria-labelledby="role-access-title"
          >
            <div className="portal-panel">
              <div className="portal-panel-heading">
                <div>
                  <p className="eyebrow">Role access</p>
                  <h2 id="role-access-title">
                    Choose the right starting point
                  </h2>
                </div>
                <Icon name="shield" aria-hidden="true" />
              </div>
              <div className="admin-role-list">
                {employeeRoles.map((employeeRole) => (
                  <button
                    className={`admin-role-option ${role === employeeRole.value ? 'is-selected' : ''}`}
                    key={employeeRole.value}
                    type="button"
                    onClick={() => setRole(employeeRole.value)}
                    aria-pressed={role === employeeRole.value}
                  >
                    <span className="admin-role-radio" aria-hidden="true">
                      <span />
                    </span>
                    <span>
                      <strong>{employeeRole.label}</strong>
                      <small>{employeeRole.description}</small>
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div className="portal-panel admin-security-note">
              <Icon name="mail" aria-hidden="true" />
              <div>
                <strong>Invitation-first security</strong>
                <p>
                  The employee receives an invitation and is required to change
                  the temporary password on first access.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </PortalLayout>
  )
}
