import { useState } from 'react'

import { adminApi } from '../api/adminApi'
import { getRoleLabel } from '../lib/accountStatus'
import { useI18n } from '../../../shared/i18n'
import type { AdminAccountItem } from '../types/accounts'
import type { UserRole } from '../../auth/types'
import { changeRoleDialogMessages } from './ChangeRoleDialog.messages'

type Props = {
  account: AdminAccountItem
  onClose: () => void
  onSuccess: () => void
}

const ASSIGNABLE_ROLES: UserRole[] = [
  'CUSTOMER',
  'STAFF',
  'DRONE_OPERATOR',
  'SYSTEM_OPERATOR',
  'AUDITOR',
]

export function ChangeRoleDialog({ account, onClose, onSuccess }: Props) {
  const { t, lang } = useI18n(changeRoleDialogMessages)
  const [role, setRole] = useState<UserRole>(account.role)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (role === account.role) {
      onClose()
      return
    }
    setLoading(true)
    setError(null)
    try {
      await adminApi.updateAccount(account.id, {
        role,
        reason: reason.trim() || undefined,
      })
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : t.genericError)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="odm-dialog-backdrop" onClick={onClose}>
      <div
        className="odm-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 420 }}
        role="dialog"
        aria-modal="true"
        aria-label={t.title}
      >
        <div className="odm-dialog-header">
          <h2 className="odm-dialog-title">{t.title}</h2>
          <button
            type="button"
            className="odm-dialog-close"
            onClick={onClose}
            aria-label={t.close}
          >
            x
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div
            className="odm-dialog-body"
            style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
          >
            <p style={{ margin: 0, color: 'var(--tx2)', fontSize: 13 }}>
              {t.user} <strong>{account.fullName}</strong>
            </p>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 12,
                  color: 'var(--tx2)',
                  marginBottom: 4,
                }}
              >
                {t.newRole}
              </label>
              <select
                className="odm-input"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
              >
                {ASSIGNABLE_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {getRoleLabel(r, lang)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 12,
                  color: 'var(--tx2)',
                  marginBottom: 4,
                }}
              >
                {t.reason}
              </label>
              <input
                className="odm-input"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t.reasonPlaceholder}
              />
            </div>
            {error && (
              <p style={{ color: 'var(--red-solid)', fontSize: 13, margin: 0 }}>
                {error}
              </p>
            )}
          </div>
          <div className="odm-dialog-footer">
            <button
              type="button"
              className="odm-btn odm-btn-gh"
              onClick={onClose}
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="odm-btn odm-btn-p"
              disabled={loading}
            >
              {loading ? t.saving : t.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
