import { useState } from 'react'

import { adminApi } from '../../api/adminApi'
import type { AdminRole } from '../../types/roles'

export function DeleteRoleDialog({
  role,
  onClose,
  onSuccess,
}: {
  role: AdminRole
  onClose: () => void
  onSuccess: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    setLoading(true)
    setError(null)
    try {
      await adminApi.deleteRole(role.id)
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi xoá vai trò.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="odm-dialog-backdrop" onClick={onClose}>
      <div
        className="odm-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 460 }}
        role="dialog"
        aria-modal="true"
      >
        <div className="odm-dialog-header">
          <h2 className="odm-dialog-title">
            {role.userCount > 0 ? `Không thể xoá vai trò ${role.code}` : 'Xoá vai trò'}
          </h2>
          <button type="button" className="odm-dialog-close" onClick={onClose}>
            x
          </button>
        </div>
        <div className="odm-dialog-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {role.userCount > 0 ? (
            <div
              className="odm-adm-banner"
              style={{ background: 'var(--red-bg)', color: 'var(--red-fg)', borderColor: 'var(--red-dot)', marginTop: 0 }}
            >
              <span style={{ fontWeight: 700 }}>
                Còn {role.userCount} người dùng đang dùng vai trò này.
              </span>{' '}
              <span>Đổi vai trò của người dùng trước, sau đó mới xoá được.</span>
            </div>
          ) : (
            <p style={{ margin: 0 }}>
              Xác nhận xoá vai trò <strong>{role.name}</strong> ({role.code})?
            </p>
          )}
          {error && <p style={{ color: 'var(--red-solid)', fontSize: 13, margin: 0 }}>{error}</p>}
        </div>
        <div className="odm-dialog-footer">
          <button type="button" className="odm-btn odm-btn-gh" onClick={onClose}>
            Đóng
          </button>
          {role.userCount === 0 && (
            <button
              type="button"
              className="odm-btn odm-btn-p"
              style={{ background: 'var(--red-solid)', borderColor: 'var(--red-solid)' }}
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? 'Đang xoá...' : 'Xoá'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
