import { useState } from 'react'

import { adminApi } from '../api/adminApi'
import type { AdminAccountItem } from '../types/accounts'

type Props = {
  account: AdminAccountItem
  onClose: () => void
  onSuccess: () => void
}

export function LockAccountDialog({ account, onClose, onSuccess }: Props) {
  const isLocked = account.status === 'INACTIVE'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleConfirm() {
    setLoading(true)
    setError(null)
    try {
      if (isLocked) {
        await adminApi.activateAccount(account.id)
      } else {
        await adminApi.deactivateAccount(account.id)
      }
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Loi khi thay doi trang thai.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="odm-dialog-backdrop" onClick={onClose}>
      <div
        className="odm-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 400 }}
        role="dialog"
        aria-modal="true"
        aria-label={isLocked ? 'Mo khoa tai khoan' : 'Khoa tai khoan'}
      >
        <div className="odm-dialog-header">
          <h2 className="odm-dialog-title">
            {isLocked ? 'Mo khoa tai khoan' : 'Khoa tai khoan'}
          </h2>
          <button type="button" className="odm-dialog-close" onClick={onClose} aria-label="Dong">
            x
          </button>
        </div>
        <div className="odm-dialog-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ margin: 0, color: 'var(--tx)' }}>
            {isLocked ? (
              <>
                Mo khoa tai khoan <strong>{account.fullName}</strong>? Tai khoan se duoc dang nhap lai.
              </>
            ) : (
              <>
                Khoa tai khoan <strong>{account.fullName}</strong>? Nguoi dung se khong the dang nhap.
              </>
            )}
          </p>
          {!isLocked && (
            <div
              style={{
                background: 'var(--yellow-solid)',
                color: '#7a4f00',
                borderRadius: 6,
                padding: '8px 12px',
                fontSize: 12,
              }}
            >
              Canh bao: Neu nguoi dung con mission dang thuc hien, hay ket thuc truoc khi khoa.
            </div>
          )}
          {error && (
            <p style={{ color: 'var(--red-solid)', fontSize: 13, margin: 0 }}>{error}</p>
          )}
        </div>
        <div className="odm-dialog-footer">
          <button type="button" className="odm-btn odm-btn-gh" onClick={onClose}>
            Huy
          </button>
          <button
            type="button"
            className="odm-btn odm-btn-p"
            style={!isLocked ? { background: 'var(--red-solid)' } : {}}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? 'Dang xu ly...' : isLocked ? 'Mo khoa' : 'Khoa'}
          </button>
        </div>
      </div>
    </div>
  )
}
