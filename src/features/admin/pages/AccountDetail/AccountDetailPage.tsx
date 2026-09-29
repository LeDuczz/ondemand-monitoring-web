import { useState } from 'react'

import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '../../../../shared/components/odm/StateView'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../shared/i18n'
import { adminApi } from '../../api/adminApi'
import { adminHref } from '../../routes'
import type { AdminAccountDetail } from '../../types/accounts'
import { accountDetailPageMessages } from './AccountDetailPage.messages'
import { AccountActionsCard } from './components/AccountActionsCard'
import { AccountHeader } from './components/AccountHeader'
import { AccountInfoCard } from './components/AccountInfoCard'
import { EditNameModal } from './components/EditNameModal'
import {
  EMPLOYEE_ROLES,
  RoleChanger,
  type EmployeeRole,
} from './components/RoleChanger'

export function AccountDetailPage({ accountId }: { accountId: string }) {
  const { t } = useI18n(accountDetailPageMessages)
  const { data, loading, error, reload } = useApiQuery(
    (signal) => adminApi.getAccount(accountId, signal),
    [accountId],
  )

  const [account, setAccount] = useState<AdminAccountDetail | null>(null)
  const [editingName, setEditingName] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const display = account ?? data ?? null

  if (loading) return <LoadingState />
  if (error || !display) return <ErrorState error={error} onRetry={reload} />

  const canChangeRole = EMPLOYEE_ROLES.includes(display.role as EmployeeRole)

  async function runAction(action: () => Promise<AdminAccountDetail>) {
    setActionLoading(true)
    setActionError(null)
    try {
      setAccount(await action())
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : t.genericError)
    } finally {
      setActionLoading(false)
    }
  }

  function handleRoleChange(newRole: EmployeeRole) {
    if (newRole === display!.role) return
    return runAction(() =>
      adminApi.updateAccount(display!.id, { role: newRole }),
    )
  }

  if (!display) return <EmptyState title={t.notFound} />

  return (
    <div style={{ maxWidth: 720 }}>
      {editingName && (
        <EditNameModal
          account={display}
          onClose={() => setEditingName(false)}
          onSaved={(name) => {
            setAccount((prev) => ({ ...(prev ?? display), fullName: name }))
            setEditingName(false)
          }}
        />
      )}

      <div style={{ marginBottom: 20, fontSize: 13, color: 'var(--tx3)' }}>
        <a
          href={adminHref({ screen: 'accounts' })}
          style={{ color: 'var(--tx3)', textDecoration: 'none' }}
        >
          {t.backToAccounts}
        </a>
      </div>

      <AccountHeader
        account={display}
        onEditName={() => setEditingName(true)}
      />
      <AccountInfoCard account={display} />
      {canChangeRole && (
        <RoleChanger
          currentRole={display.role}
          disabled={actionLoading}
          onChange={handleRoleChange}
        />
      )}
      <AccountActionsCard
        inactive={display.status === 'INACTIVE'}
        loading={actionLoading}
        error={actionError}
        onDeactivate={() =>
          runAction(() => adminApi.deactivateAccount(display.id))
        }
        onActivate={() => runAction(() => adminApi.activateAccount(display.id))}
      />
    </div>
  )
}
