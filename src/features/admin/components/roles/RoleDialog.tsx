import { useState } from 'react'

import { adminApi } from '../../api/adminApi'
import type {
  AdminRole,
  CreateRolePayload,
  UpdateRolePayload,
} from '../../types/roles'

export function RoleDialog({
  initial,
  onClose,
  onSuccess,
}: {
  initial?: AdminRole
  onClose: () => void
  onSuccess: () => void
}) {
  const [code, setCode] = useState(initial?.code ?? '')
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [isActive, setIsActive] = useState(initial?.isActive ?? true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isEdit = Boolean(initial)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      if (isEdit && initial) {
        const payload: UpdateRolePayload = { name, description, isActive }
        await adminApi.updateRole(initial.id, payload)
      } else {
        const payload: CreateRolePayload = {
          code: code.toUpperCase(),
          name,
          description,
          isActive,
        }
        await adminApi.createRole(payload)
      }
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi lưu vai trò.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="odm-dialog-backdrop" onClick={onClose}>
      <div
        className="odm-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 500 }}
        role="dialog"
        aria-modal="true"
      >
        <div className="odm-dialog-header">
          <h2 className="odm-dialog-title">
            {isEdit ? `Sửa vai trò ${initial?.code}` : 'Tạo vai trò'}
          </h2>
          <button type="button" className="odm-dialog-close" onClick={onClose}>
            x
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div
            className="odm-dialog-body"
            style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
          >
            <div>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--tx2)', marginBottom: 4 }}>
                code {!isEdit && <span style={{ color: 'var(--red-solid)' }}>*</span>}
              </label>
              <input
                className="odm-input odm-mono"
                value={isEdit ? code : code.toUpperCase()}
                onChange={(e) => !isEdit && setCode(e.target.value.toUpperCase())}
                readOnly={isEdit}
                placeholder="VIEWER"
                required
                style={isEdit ? { background: 'var(--sf3)' } : {}}
              />
              <div style={{ fontSize: 11.5, color: 'var(--tx3)', marginTop: 4 }}>
                {isEdit ? 'Không đổi được sau khi tạo' : 'Chữ in hoa, không dấu, duy nhất'}
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--tx2)', marginBottom: 4 }}>
                name {!isEdit && <span style={{ color: 'var(--red-solid)' }}>*</span>}
              </label>
              <input className="odm-input" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--tx2)', marginBottom: 4 }}>
                description
              </label>
              <input className="odm-input" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            {!isEdit && (
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                Kích hoạt ngay (is_active)
              </label>
            )}
            {error && <p style={{ color: 'var(--red-solid)', fontSize: 13, margin: 0 }}>{error}</p>}
          </div>
          <div className="odm-dialog-footer">
            <button type="button" className="odm-btn odm-btn-gh" onClick={onClose}>
              Huỷ
            </button>
            <button type="submit" className="odm-btn odm-btn-p" disabled={loading}>
              {loading ? 'Đang lưu...' : isEdit ? 'Lưu' : 'Tạo vai trò'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
