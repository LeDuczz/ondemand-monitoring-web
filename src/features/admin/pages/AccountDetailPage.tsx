import { useState } from 'react'

import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '../../../shared/components/odm/StateView'
import { StatusBadge } from '../../../shared/components/odm/StatusBadge'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../shared/i18n'
import { adminApi } from '../api/adminApi'
import {
  getAccountStatusMeta,
  fmtDate,
  fmtDateTime,
  getRoleLabel,
} from '../lib/accountStatus'
import { adminHref } from '../routes'
import type { UserRole } from '../../auth/types'
import type { AdminAccountDetail } from '../types/accounts'
import { accountDetailPageMessages } from './AccountDetailPage.messages'

type EmployeeRole = Exclude<UserRole, 'CUSTOMER' | 'ADMIN'>

const EMPLOYEE_ROLES: EmployeeRole[] = [
  'STAFF',
  'DRONE_OPERATOR',
  'SYSTEM_OPERATOR',
]

function EditNameModal({
  account,
  onClose,
  onSaved,
}: {
  account: AdminAccountDetail
  onClose: () => void
  onSaved: (name: string) => void
}) {
  const { t } = useI18n(accountDetailPageMessages)
  const [value, setValue] = useState(account.fullName)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  async function handleSave() {
    const trimmed = value.trim()
    if (!trimmed) {
      setErr(t.required)
      return
    }
    setSaving(true)
    setErr('')
    try {
      await adminApi.updateAccount(account.id, { fullName: trimmed })
      onSaved(trimmed)
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : t.genericError)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg)',
          border: '1px solid var(--bd)',
          borderRadius: 12,
          padding: 24,
          width: 360,
          maxWidth: '90vw',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>{t.editNameTitle}</h3>
        <input
          className="odm-input"
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            setErr('')
          }}
          autoFocus
          style={{ marginBottom: 4 }}
        />
        {err && (
          <div
            style={{ fontSize: 12, color: 'var(--red-solid)', marginBottom: 8 }}
          >
            {err}
          </div>
        )}
        <div
          style={{
            display: 'flex',
            gap: 8,
            marginTop: 12,
            justifyContent: 'flex-end',
          }}
        >
          <button
            type="button"
            className="odm-btn odm-btn-gh"
            onClick={onClose}
          >
            {t.cancel}
          </button>
          <button
            type="button"
            className="odm-btn odm-btn-p"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? t.saving : t.save}
          </button>
        </div>
      </div>
    </div>
  )
}

export function AccountDetailPage({ accountId }: { accountId: string }) {
  const { t, lang } = useI18n(accountDetailPageMessages)
  const { data, loading, error, reload } = useApiQuery(
    (signal) => adminApi.getAccount(accountId, signal),
    [accountId],
  )

  const [account, setAccount] = useState<AdminAccountDetail | null>(null)
  const [editingName, setEditingName] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const display = account ?? data ?? null

  if (loading) return <LoadingState />
  if (error || !display) return <ErrorState error={error} onRetry={reload} />

  const statusMeta = getAccountStatusMeta(display.status, lang)
  const canChangeRole = EMPLOYEE_ROLES.includes(display.role as EmployeeRole)

  async function handleRoleChange(newRole: EmployeeRole) {
    if (newRole === display!.role) return
    setActionLoading(true)
    setActionError(null)
    try {
      const updated = await adminApi.updateAccount(display!.id, {
        role: newRole,
      })
      setAccount(updated)
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : t.genericError)
    } finally {
      setActionLoading(false)
    }
  }

  async function handleDeactivate() {
    setActionLoading(true)
    setActionError(null)
    try {
      const updated = await adminApi.deactivateAccount(display!.id)
      setAccount(updated)
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : t.genericError)
    } finally {
      setActionLoading(false)
    }
  }

  async function handleActivate() {
    setActionLoading(true)
    setActionError(null)
    try {
      const updated = await adminApi.activateAccount(display!.id)
      setAccount(updated)
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : t.genericError)
    } finally {
      setActionLoading(false)
    }
  }

  if (!display) return <EmptyState title={t.notFound} />

  return (
    <div style={{ maxWidth: 720 }}>
      {editingName && (
        <EditNameModal
          account={display}
          onClose={() => setEditingName(false)}
          onSaved={(name) => {
            setAccount((prev) => ({ ...(prev ?? display), fullName: name }))
            setEditingName(false)
          }}
        />
      )}

      <div style={{ marginBottom: 20, fontSize: 13, color: 'var(--tx3)' }}>
        <a
          href={adminHref({ screen: 'accounts' })}
          style={{ color: 'var(--tx3)', textDecoration: 'none' }}
        >
          {t.backToAccounts}
        </a>
      </div>

      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: display.avatarUrl ? undefined : 'var(--sf3)',
            backgroundImage: display.avatarUrl
              ? `url(${display.avatarUrl})`
              : undefined,
            backgroundSize: 'cover',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            fontWeight: 700,
            flex: 'none',
          }}
        >
          {!display.avatarUrl && (display.fullName[0] ?? '?').toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flexWrap: 'wrap',
            }}
          >
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
              {display.fullName}
            </h1>
            <button
              type="button"
              className="odm-btn odm-btn-gh"
              style={{ fontSize: 11, padding: '3px 8px' }}
              onClick={() => setEditingName(true)}
            >
              {t.changeName}
            </button>
          </div>
          <div style={{ fontSize: 13, color: 'var(--tx3)', marginTop: 2 }}>
            {display.email}
          </div>
        </div>
        <StatusBadge tone={statusMeta.tone} size="lg">
          {statusMeta.label}
        </StatusBadge>
      </div>

      {/* Details card */}
      <div
        style={{
          background: 'var(--sf)',
          border: '1px solid var(--bd)',
          borderRadius: 10,
          padding: '16px 20px',
          marginBottom: 16,
        }}
      >
        <h2 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 600 }}>
          {t.accountInfo}
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '10px 24px',
          }}
        >
          <div>
            <div style={{ fontSize: 11, color: 'var(--tx3)', marginBottom: 2 }}>
              {t.idLabel}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
              {display.id}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--tx3)', marginBottom: 2 }}>
              {t.roleLabel}
            </div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>
              {getRoleLabel(display.role, lang) ?? display.role}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--tx3)', marginBottom: 2 }}>
              {t.emailVerification}
            </div>
            <div style={{ fontSize: 13 }}>
              {display.emailVerified ? (
                <span style={{ color: 'var(--green-solid)' }}>
                  {t.verified}
                </span>
              ) : (
                <span style={{ color: 'var(--yellow-solid)' }}>
                  {t.unverified}
                </span>
              )}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--tx3)', marginBottom: 2 }}>
              {t.createdAt}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
              {fmtDate(display.createdAt, lang)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--tx3)', marginBottom: 2 }}>
              {t.lastLogin}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
              {display.lastLoginAt
                ? fmtDateTime(display.lastLoginAt, lang)
                : '—'}
            </div>
          </div>
          {display.linkedProviders.length > 0 && (
            <div>
              <div
                style={{ fontSize: 11, color: 'var(--tx3)', marginBottom: 2 }}
              >
                OAuth
              </div>
              <div style={{ fontSize: 12 }}>
                {display.linkedProviders.join(', ')}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Role changer */}
      {canChangeRole && (
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
            {t.changeRole}
          </h2>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {EMPLOYEE_ROLES.map((r) => (
              <button
                key={r}
                type="button"
                className={`odm-btn ${display.role === r ? 'odm-btn-p' : 'odm-btn-gh'}`}
                disabled={actionLoading || display.role === r}
                onClick={() => handleRoleChange(r)}
              >
                {getRoleLabel(r, lang)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div
        style={{
          background: 'var(--sf)',
          border: '1px solid var(--bd)',
          borderRadius: 10,
          padding: '16px 20px',
          marginBottom: 16,
        }}
      >
        <h2 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600 }}>
          {t.actions}
        </h2>
        <p style={{ margin: '0 0 12px', fontSize: 12, color: 'var(--tx3)' }}>
          {t.deactivateHint}
        </p>

        {actionError && (
          <div
            role="alert"
            style={{
              background: 'var(--red-muted, #fee2e2)',
              border: '1px solid var(--red-solid)',
              borderRadius: 8,
              padding: '8px 12px',
              marginBottom: 12,
              fontSize: 13,
              color: 'var(--red-solid)',
            }}
          >
            {actionError}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          {display.status !== 'INACTIVE' && (
            <button
              type="button"
              className="odm-btn odm-btn-gh"
              style={{
                borderColor: 'var(--red-solid)',
                color: 'var(--red-solid)',
              }}
              disabled={actionLoading}
              onClick={handleDeactivate}
            >
              {actionLoading ? t.processing : t.deactivate}
            </button>
          )}
          {display.status === 'INACTIVE' && (
            <button
              type="button"
              className="odm-btn odm-btn-p"
              disabled={actionLoading}
              onClick={handleActivate}
            >
              {actionLoading ? t.processing : t.reactivate}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
