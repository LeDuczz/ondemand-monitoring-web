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
      setError(
        err instanceof Error ? err.message : 'Lỗi khi thay đổi trạng thái.',
      )
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
        aria-label={isLocked ? 'Mở khoá tài khoản' : 'Khoá tài khoản'}
      >
        <div className="odm-dialog-header">
          <h2 className="odm-dialog-title">
            {isLocked ? 'Mở khoá tài khoản' : 'Khoá tài khoản'}
          </h2>
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
            {isLocked ? (
              <>
                Mở khoá tài khoản <strong>{account.fullName}</strong>? Tài khoản
                sẽ được đăng nhập lại.
              </>
            ) : (
              <>
                Khoá tài khoản <strong>{account.fullName}</strong>? Người dùng
                sẽ không thể đăng nhập.
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
              Cảnh báo: Nếu người dùng còn nhiệm vụ đang thực hiện, hãy kết thúc
              trước khi khoá.
            </div>
          )}
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
            style={!isLocked ? { background: 'var(--red-solid)' } : {}}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? 'Đang xử lý...' : isLocked ? 'Mở khoá' : 'Khoá'}
          </button>
        </div>
      </div>
    </div>
  )
}
