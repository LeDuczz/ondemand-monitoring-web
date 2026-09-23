import { useState } from 'react'

import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '../../../shared/components/odm/StateView'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { adminApi } from '../api/adminApi'
import { DeleteRoleDialog } from '../components/roles/DeleteRoleDialog'
import { RoleDialog } from '../components/roles/RoleDialog'
import { RolesTable } from '../components/roles/RolesTable'
import { rolesSubtitle } from '../lib/rolesSubtitle'
import type { AdminRole } from '../types/roles'

type DialogState =
  | { type: 'create' }
  | { type: 'edit'; role: AdminRole }
  | { type: 'delete'; role: AdminRole }
  | null

export function RolesPage() {
  const [dialog, setDialog] = useState<DialogState>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const { data, loading, error, reload } = useApiQuery(
    (signal) => adminApi.listRoles(signal),
    [],
  )

  function handleSuccess() {
    setDialog(null)
    reload()
  }

  async function handleToggle(role: AdminRole) {
    setTogglingId(role.id)
    try {
      await adminApi.toggleRoleActive(role.id, !role.isActive)
      reload()
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 16,
          marginBottom: 16,
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>Vai trò</h1>
          {data && (
            <div style={{ color: 'var(--tx3)', fontSize: 12.5, marginTop: 3 }}>
              {rolesSubtitle(data.items)}
            </div>
          )}
        </div>
        <button
          type="button"
          className="odm-btn odm-btn-p"
          onClick={() => setDialog({ type: 'create' })}
        >
          + Tạo vai trò
        </button>
      </div>

      {loading && <LoadingState />}
      {!loading && (error || !data) && (
        <ErrorState error={error} onRetry={reload} />
      )}
      {!loading && data && data.items.length === 0 && (
        <EmptyState title="Chưa có vai trò nào" description="" />
      )}

      {!loading && data && data.items.length > 0 && (
        <RolesTable
          roles={data.items}
          togglingId={togglingId}
          onToggle={handleToggle}
          onEdit={(role) => setDialog({ type: 'edit', role })}
          onDelete={(role) => setDialog({ type: 'delete', role })}
        />
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
