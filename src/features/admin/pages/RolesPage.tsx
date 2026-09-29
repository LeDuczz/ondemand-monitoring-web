import { useState } from 'react'

import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '../../../shared/components/odm/StateView'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../shared/i18n'
import { adminApi } from '../api/adminApi'
import { DeleteRoleDialog } from '../components/roles/DeleteRoleDialog'
import { RoleDialog } from '../components/roles/RoleDialog'
import { RolesTable } from '../components/roles/RolesTable'
import { rolesSubtitle } from '../lib/rolesSubtitle'
import type { AdminRole } from '../types/roles'
import { rolesPageMessages } from './RolesPage.messages'
import { PageHeader } from '../components/common/PageHeader'

type DialogState =
  | { type: 'create' }
  | { type: 'edit'; role: AdminRole }
  | { type: 'delete'; role: AdminRole }
  | null

export function RolesPage() {
  const { t, lang } = useI18n(rolesPageMessages)
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
      <PageHeader
        title={t.title}
        subtitle={data ? rolesSubtitle(data.items, lang) : undefined}
        actions={
          <button
            type="button"
            className="odm-btn odm-btn-p"
            onClick={() => setDialog({ type: 'create' })}
          >
            {t.createRole}
          </button>
        }
      />

      {loading && <LoadingState />}
      {!loading && (error || !data) && (
        <ErrorState error={error} onRetry={reload} />
      )}
      {!loading && data && data.items.length === 0 && (
        <EmptyState title={t.emptyTitle} description="" />
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
