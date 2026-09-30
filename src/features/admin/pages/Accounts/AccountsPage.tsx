import { useEffect, useState } from 'react'

import {
  ErrorState,
  LoadingState,
} from '../../../../shared/components/odm/StateView'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../shared/i18n'
import {
  adminUsersApi,
  type ManagedAccountResponse,
} from '../../api/adminUsersApi'
import { EmptyState } from '../../../../shared/components/ui'
import { PageHeader } from '../../../../shared/components/ui'
import { TableCard } from '../../../../shared/components/ui'
import { mapUserSummary } from '../../lib/accountMappers'
import { adminHref } from '../../routes'
import type { AdminAccountItem } from '../../types/accounts'
import { accountsPageMessages } from './AccountsPage.messages'
import { AccountsFilters } from './components/AccountsFilters'
import { AccountsTable } from './components/AccountsTable'
import { CreateUserModal } from './components/CreateUserModal'
import { EditUserModal } from './components/EditUserModal'
import { LockAccountDialog } from './components/LockAccountDialog'
import { Pager } from './components/Pager'
import { ResetPasswordDialog } from './components/ResetPasswordDialog'
import { buildListParams, type AccountsFilterState } from './listParams'

type DialogState =
  | { type: 'edit'; account: AdminAccountItem }
  | { type: 'lock'; account: AdminAccountItem }
  | { type: 'resetPwd'; account: AdminAccountItem }
  | null

const NO_FILTERS: AccountsFilterState = { search: '', role: '', status: '' }

export function AccountsPage({ openCreate = false }: { openCreate?: boolean }) {
  const { t } = useI18n(accountsPageMessages)
  const [filters, setFilters] = useState(NO_FILTERS)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [dialog, setDialog] = useState<DialogState>(null)
  const [creating, setCreating] = useState(openCreate)
  const [created, setCreated] = useState<ManagedAccountResponse | null>(null)

  useEffect(() => setCreating(openCreate), [openCreate])

  // Debounce free-text search so each keystroke does not hit the backend.
  useEffect(() => {
    const id = window.setTimeout(() => {
      setSearch(filters.search)
      setPage(0)
    }, 300)
    return () => window.clearTimeout(id)
  }, [filters.search])

  const { data, loading, error, reload } = useApiQuery(
    (signal) =>
      adminUsersApi
        .listUsers({
          ...buildListParams({ ...filters, search }, page),
          signal,
        })
        .then((res) => ({ ...res, items: res.items.map(mapUserSummary) })),
    [page, search, filters.role, filters.status],
  )

  function changeFilters(next: AccountsFilterState) {
    if (next.role !== filters.role || next.status !== filters.status) setPage(0)
    setFilters(next)
  }

  function closeCreate() {
    setCreating(false)
    if (openCreate) window.location.hash = adminHref({ screen: 'accounts' })
  }

  function handleDialogDone() {
    setDialog(null)
    reload()
  }

  return (
    <div>
      <PageHeader
        title={t.title}
        subtitle={data ? `${data.totalItems} ${t.subtitle}` : undefined}
        actions={
          <button
            type="button"
            className="odm-btn odm-btn-p"
            onClick={() => setCreating(true)}
          >
            {t.createUser}
          </button>
        }
      />

      {created && (
        <div role="status" className="adm-alert is-success">
          <strong>{t.createdBanner}: </strong>
          {created.email}.{' '}
          {created.invitationSent ? t.invitationSent : ''}{' '}
          {created.passwordChangeRequired ? t.passwordChangeRequired : ''}
        </div>
      )}

      <AccountsFilters value={filters} onChange={changeFilters} />

      {loading && !data && <LoadingState />}
      {!loading && (error !== undefined || !data) && (
        <ErrorState error={error} onRetry={reload} />
      )}
      {data && data.items.length === 0 && !loading && (
        <EmptyState title={t.emptyTitle} description={t.emptyDescription} />
      )}
      {data && data.items.length > 0 && (
        <TableCard
          footer={
            <Pager
              page={data.page}
              totalPages={data.totalPages}
              totalItems={data.totalItems}
              onPage={setPage}
            />
          }
        >
          <AccountsTable
            items={data.items}
            onEdit={(account) => setDialog({ type: 'edit', account })}
            onLock={(account) => setDialog({ type: 'lock', account })}
            onResetPassword={(account) =>
              setDialog({ type: 'resetPwd', account })
            }
          />
        </TableCard>
      )}

      {creating && (
        <CreateUserModal
          onClose={closeCreate}
          onCreated={(result) => {
            setCreated(result)
            closeCreate()
            setPage(0)
            reload()
          }}
        />
      )}
      {dialog?.type === 'edit' && (
        <EditUserModal
          userId={dialog.account.id}
          onClose={() => setDialog(null)}
          onChanged={reload}
        />
      )}
      {dialog?.type === 'lock' && (
        <LockAccountDialog
          account={dialog.account}
          onClose={() => setDialog(null)}
          onSuccess={handleDialogDone}
        />
      )}
      {dialog?.type === 'resetPwd' && (
        <ResetPasswordDialog
          account={dialog.account}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  )
}
