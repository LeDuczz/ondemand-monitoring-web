import { AdminToggle } from '../AdminToggle'
import type { AdminRole } from '../../types/roles'

const LockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="11" width="14" height="9.5" rx="2" />
    <path d="M8 11V7.5a4 4 0 018 0V11" />
  </svg>
)

export function RolesTable({
  roles,
  togglingId,
  onToggle,
  onEdit,
  onDelete,
}: {
  roles: AdminRole[]
  togglingId: string | null
  onToggle: (role: AdminRole) => void
  onEdit: (role: AdminRole) => void
  onDelete: (role: AdminRole) => void
}) {
  const systemCodes = roles.filter((r) => r.isSystemRole).map((r) => r.code)

  return (
    <>
      <div className="odm-card" style={{ overflow: 'hidden' }}>
        <table className="odm-adm-table">
          <thead>
            <tr>
              <th style={{ width: 210 }}>Vai trò</th>
              <th>Mô tả</th>
              <th style={{ width: 120 }}>Loại</th>
              <th style={{ width: 90 }}>is_active</th>
              <th style={{ width: 80, textAlign: 'right' }}>Số user</th>
              <th style={{ width: 100 }} />
            </tr>
          </thead>
          <tbody>
            {roles.map((role) => (
              <tr key={role.id}>
                <td>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{role.name}</div>
                  <div className="odm-mono" style={{ fontSize: 11, color: 'var(--tx3)' }}>
                    {role.code}
                  </div>
                </td>
                <td style={{ fontSize: 12, color: 'var(--tx2)', maxWidth: 320 }}>
                  {role.description}
                </td>
                <td>
                  {role.isSystemRole ? (
                    <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center', fontWeight: 600, color: 'var(--tx2)' }}>
                      <LockIcon />
                      Hệ thống
                    </span>
                  ) : (
                    <span style={{ color: 'var(--tx3)' }}>Tuỳ chỉnh</span>
                  )}
                </td>
                <td>
                  <AdminToggle
                    active={role.isActive}
                    label={role.name}
                    onToggle={() => onToggle(role)}
                    disabled={togglingId === role.id}
                  />
                </td>
                <td style={{ fontSize: 13, textAlign: 'right' }} className="odm-mono">
                  {role.userCount}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                    {!role.isSystemRole ? (
                      <>
                        <button
                          type="button"
                          className="odm-btn odm-btn-gh odm-btn-sm odm-btn-ic1"
                          onClick={() => onEdit(role)}
                          aria-label="Sửa"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 20l4-1 11-11-3-3L5 16z" />
                            <path d="M14 6l3 3" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          className="odm-btn odm-btn-gh odm-btn-sm odm-btn-ic1"
                          onClick={() => onDelete(role)}
                          aria-label="Xoá"
                          style={{ color: 'var(--red-solid)' }}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
                          </svg>
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="odm-btn odm-btn-gh odm-btn-sm odm-btn-ic1 odm-btn-dis"
                        disabled
                        aria-label="Vai trò hệ thống, không thể sửa hoặc xoá"
                      >
                        <LockIcon />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {systemCodes.length > 0 && (
        <div className="odm-adm-banner">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="11" width="14" height="9.5" rx="2" />
            <path d="M8 11V7.5a4 4 0 018 0V11" />
          </svg>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontWeight: 700 }}>Vai trò hệ thống</span>{' '}
            <span>
              {systemCodes.join(', ')} được hệ thống dùng trực tiếp trong phân
              quyền nên không thể sửa hay xoá (is_system_role = true). Bạn chỉ
              có thể xem số người dùng đang dùng.
            </span>
          </div>
        </div>
      )}
    </>
  )
}
