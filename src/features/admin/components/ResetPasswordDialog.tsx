import { useState } from 'react'

import { adminApi } from '../api/adminApi'
import type { AdminAccountItem } from '../types/accounts'

type Props = {
  account: AdminAccountItem
  onClose: () => void
  onSuccess: () => void
}

export function ResetPasswordDialog({ account, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleConfirm() {
    setLoading(true)
    setError(null)
    try {
      await adminApi.resetPassword(account.id)
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi gửi email reset.')
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
        aria-label="Reset mật khẩu"
      >
        <div className="odm-dialog-header">
          <h2 className="odm-dialog-title">Reset mật khẩu</h2>
          <button
            type="button"
            className="odm-dialog-close"
            onClick={onClose}
            aria-label="Đóng"
          >
            x
          </button>
        </div>
        <div
          className="odm-dialog-body"
          style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
        >
          <p style={{ margin: 0, color: 'var(--tx)' }}>
            Gửi email reset mật khẩu đến <strong>{account.email}</strong>?
          </p>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--tx2)' }}>
            Người dùng sẽ nhận được link đặt lại mật khẩu qua email.
          </p>
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
            Huỷ
          </button>
          <button
            type="button"
            className="odm-btn odm-btn-p"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? 'Đang gửi...' : 'Gửi email reset'}
          </button>
        </div>
      </div>
    </div>
  )
}
