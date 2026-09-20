import { useState } from 'react'

import { adminApi } from '../api/adminApi'
import { ROLE_LABEL } from '../lib/accountStatus'
import type { AdminAccountItem } from '../types/accounts'
import type { UserRole } from '../../auth/types'

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
  const [role, setRole] = useState<UserRole>(account.role)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (role === account.role) { onClose(); return }
    setLoading(true)
    setError(null)
    try {
      await adminApi.updateAccount(account.id, { role, reason: reason.trim() || undefined })
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Loi khi doi vai tro.')
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
        aria-label="Doi vai tro"
      >
        <div className="odm-dialog-header">
          <h2 className="odm-dialog-title">Doi vai tro</h2>
          <button type="button" className="odm-dialog-close" onClick={onClose} aria-label="Dong">
            x
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="odm-dialog-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p style={{ margin: 0, color: 'var(--tx2)', fontSize: 13 }}>
              Nguoi dung: <strong>{account.fullName}</strong>
            </p>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--tx2)', marginBottom: 4 }}>
                Vai tro moi
              </label>
              <select
                className="odm-input"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
              >
                {ASSIGNABLE_ROLES.map((r) => (
                  <option key={r} value={r}>{ROLE_LABEL[r]}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--tx2)', marginBottom: 4 }}>
                Ly do (tuy chon)
              </label>
              <input
                className="odm-input"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Vi du: Thang chuc, chuyen bo phan..."
              />
            </div>
            {error && (
              <p style={{ color: 'var(--red-solid)', fontSize: 13, margin: 0 }}>{error}</p>
            )}
          </div>
          <div className="odm-dialog-footer">
            <button type="button" className="odm-btn odm-btn-gh" onClick={onClose}>
              Huy
            </button>
            <button type="submit" className="odm-btn odm-btn-p" disabled={loading}>
              {loading ? 'Dang luu...' : 'Luu thay doi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
