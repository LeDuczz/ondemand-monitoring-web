import { useState } from 'react'

import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '../../../shared/components/odm/StateView'
import { StatusBadge } from '../../../shared/components/odm/StatusBadge'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { adminApi } from '../api/adminApi'
import type {
  AdminRole,
  CreateRolePayload,
  UpdateRolePayload,
} from '../types/roles'

type DialogState =
  | { type: 'create' }
  | { type: 'edit'; role: AdminRole }
  | { type: 'delete'; role: AdminRole }
  | null

function RoleDialog({
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
        style={{ maxWidth: 460 }}
        role="dialog"
        aria-modal="true"
      >
        <div className="odm-dialog-header">
          <h2 className="odm-dialog-title">
            {isEdit ? 'Sửa vai trò' : 'Tạo vai trò mới'}
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
              <label
                style={{
                  display: 'block',
                  fontSize: 12,
                  color: 'var(--tx2)',
                  marginBottom: 4,
                }}
              >
                Mã vai trò *
              </label>
              <input
                className="odm-input"
                value={isEdit ? code : code.toUpperCase()}
                onChange={(e) =>
                  !isEdit && setCode(e.target.value.toUpperCase())
                }
                readOnly={isEdit}
                placeholder="Ví dụ: AUDITOR"
                required
                style={isEdit ? { opacity: 0.6 } : {}}
              />
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
                Tên vai trò *
              </label>
              <input
                className="odm-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
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
                Mô tả
              </label>
              <input
                className="odm-input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 13,
              }}
            >
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              Đang hoạt động
            </label>
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
              type="submit"
              className="odm-btn odm-btn-p"
              disabled={loading}
            >
              {loading ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function DeleteRoleDialog({
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
        style={{ maxWidth: 400 }}
        role="dialog"
        aria-modal="true"
      >
        <div className="odm-dialog-header">
          <h2 className="odm-dialog-title">Xoá vai trò</h2>
          <button type="button" className="odm-dialog-close" onClick={onClose}>
            x
          </button>
        </div>
        <div
          className="odm-dialog-body"
          style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
        >
          {role.userCount > 0 ? (
            <p style={{ color: 'var(--red-solid)', margin: 0 }}>
              Không thể xoá: có {role.userCount} người dùng đang sử dụng vai trò
              này.
            </p>
          ) : (
            <p style={{ margin: 0 }}>
              Xác nhận xoá vai trò <strong>{role.name}</strong> ({role.code})?
            </p>
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
            Đóng
          </button>
          {role.userCount === 0 && (
            <button
              type="button"
              className="odm-btn odm-btn-p"
              style={{ background: 'var(--red-solid)' }}
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

export function RolesPage() {
  const [dialog, setDialog] = useState<DialogState>(null)
  const { data, loading, error, reload } = useApiQuery(
    (signal) => adminApi.listRoles(signal),
    [],
  )

  function handleSuccess() {
    setDialog(null)
    reload()
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Vai trò</h1>
        <button
          type="button"
          className="odm-btn odm-btn-p"
          onClick={() => setDialog({ type: 'create' })}
        >
          + Tạo vai trò
        </button>
      </div>

      <div
        style={{
          background: 'var(--yellow-solid)',
          color: '#7a4f00',
          border: '1px solid #d97706',
          borderRadius: 8,
          padding: '8px 14px',
          fontSize: 12,
          marginBottom: 16,
        }}
      >
        Vai trò hệ thống (CUSTOMER, STAFF, DRONE_OPERATOR, ADMIN) không thể
        sửa/xoá.
      </div>

      {loading && <LoadingState />}
      {!loading && (error || !data) && (
        <ErrorState error={error} onRetry={reload} />
      )}
      {!loading && data && data.items.length === 0 && (
        <EmptyState title="Chưa có vai trò nào" description="" />
      )}

      {!loading && data && data.items.length > 0 && (
        <div
          style={{
            background: 'var(--sf)',
            border: '1px solid var(--bd)',
            borderRadius: 10,
            overflow: 'hidden',
          }}
        >
          <table className="odm-adm-table">
            <thead>
              <tr>
                <th>Vai trò</th>
                <th>Mô tả</th>
                <th>Loại</th>
                <th>Trạng thái</th>
                <th>Số user</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((role) => (
                <tr key={role.id}>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>
                      {role.name}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--tx3)',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {role.code}
                    </div>
                  </td>
                  <td
                    style={{ fontSize: 12, color: 'var(--tx2)', maxWidth: 260 }}
                  >
                    {role.description}
                  </td>
                  <td>
                    <StatusBadge tone={role.isSystemRole ? 'blue' : 'orange'}>
                      {role.isSystemRole ? 'Hệ thống' : 'Tuỳ chỉnh'}
                    </StatusBadge>
                  </td>
                  <td>
                    <StatusBadge tone={role.isActive ? 'green' : 'gray'}>
                      {role.isActive ? 'Hoạt động' : 'Tắt'}
                    </StatusBadge>
                  </td>
                  <td style={{ fontSize: 13, textAlign: 'center' }}>
                    {role.userCount}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {!role.isSystemRole ? (
                        <>
                          <button
                            type="button"
                            className="odm-btn odm-btn-gh"
                            style={{ fontSize: 11, padding: '3px 8px' }}
                            onClick={() => setDialog({ type: 'edit', role })}
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            className="odm-btn odm-btn-gh"
                            style={{
                              fontSize: 11,
                              padding: '3px 8px',
                              color: 'var(--red-solid)',
                            }}
                            onClick={() => setDialog({ type: 'delete', role })}
                          >
                            Xoá
                          </button>
                        </>
                      ) : (
                        <span style={{ fontSize: 11, color: 'var(--tx3)' }}>
                          —
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(dialog?.type === 'create' || dialog?.type === 'edit') && (
        <RoleDialog
          initial={dialog.type === 'edit' ? dialog.role : undefined}
          onClose={() => setDialog(null)}
          onSuccess={handleSuccess}
        />
      )}
      {dialog?.type === 'delete' && (
        <DeleteRoleDialog
          role={dialog.role}
          onClose={() => setDialog(null)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  )
}
