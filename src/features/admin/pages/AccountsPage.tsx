import { useMemo, useState } from 'react'

import {
  ErrorState,
  LoadingState,
} from '../../../shared/components/odm/StateView'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../shared/i18n'
import { adminUsersApi } from '../api/adminUsersApi'
import { mapUserSummary } from '../lib/accountMappers'
import {
  getAccountStatusMeta,
  accountsSubtitle,
  certDaysLeftLabel,
  computeAccountCounts,
  filterAccounts,
  fmtDate,
  fmtDateTime,
  pageRangeLabel,
} from '../lib/accountStatus'
import { adminHref } from '../routes'
import { AccountActions } from '../components/AccountActions'
import {
  AccountsFilters,
  type RoleFilter,
  type StatusFilter,
} from '../components/AccountsFilters'
import { EmptyState } from '../components/common/EmptyState'
import { PageHeader } from '../components/common/PageHeader'
import { StatusBadge, toAdminTone } from '../components/common/StatusBadge'
import { TableCard } from '../components/common/TableCard'
import { CertExpiryBanner } from '../components/CertExpiryBanner'
import { ChangeRoleDialog } from '../components/ChangeRoleDialog'
import { LockAccountDialog } from '../components/LockAccountDialog'
import { ResetPasswordDialog } from '../components/ResetPasswordDialog'
import { RoleCodeBadge } from '../components/RoleCodeBadge'
import type { AdminAccountItem } from '../types/accounts'
import { accountsPageMessages } from './AccountsPage.messages'

const ACCOUNTS_PAGE_SIZE = 50

type DialogState =
  | { type: 'changeRole'; account: AdminAccountItem }
  | { type: 'lock'; account: AdminAccountItem }
  | { type: 'resetPwd'; account: AdminAccountItem }
  | null

export function AccountsPage() {
  const { t, lang } = useI18n(accountsPageMessages)
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('')
  const [dialog, setDialog] = useState<DialogState>(null)

  // The UI has no pager yet: fetch the first page (size 50) and filter
  // role/status/search client-side.
  const { data, loading, error, reload } = useApiQuery(
    (signal) =>
      adminUsersApi
        .listUsers({ page: 0, size: ACCOUNTS_PAGE_SIZE, sort: 'createdAt,desc', signal })
        .then((page) => ({ items: page.items.map(mapUserSummary) })),
    [],
  )

  const filtered = useMemo(
    () =>
      data
        ? filterAccounts(data.items, {
            query,
            role: roleFilter,
            status: statusFilter,
          })
        : [],
    [data, query, roleFilter, statusFilter],
  )

  function handleDialogSuccess() {
    setDialog(null)
    reload()
  }

  return (
    <div>
      <PageHeader
        title={t.title}
        subtitle={
          data
            ? accountsSubtitle(computeAccountCounts(data.items), lang)
            : undefined
        }
        actions={
          <a
            className="odm-btn odm-btn-p"
            href={adminHref({ screen: 'createAccount' })}
          >
            {t.createInternal}
          </a>
        }
      />

      {data && <CertExpiryBanner accounts={data.items} />}

      <AccountsFilters
        query={query}
        onQueryChange={setQuery}
        role={roleFilter}
        onRoleChange={setRoleFilter}
        status={statusFilter}
        onStatusChange={setStatusFilter}
      />

      {loading && <LoadingState />}

      {!loading && (error || !data) && (
        <ErrorState error={error} onRetry={reload} />
      )}

      {!loading && data && filtered.length === 0 && (
        <EmptyState
          title={t.emptyTitle}
          description={t.emptyDescription}
          action={
            <a
              className="odm-btn odm-btn-p"
              href={adminHref({ screen: 'createAccount' })}
            >
              {t.createAccount}
            </a>
          }
        />
      )}

      {!loading && data && filtered.length > 0 && (
        <TableCard
          footer={pageRangeLabel(filtered.length, filtered.length, lang)}
        >
          <table className="odm-adm-table">
            <thead>
              <tr>
                <th>{t.columnUser}</th>
                <th>{t.columnRole}</th>
                <th>{t.columnStatus}</th>
                <th>{t.columnCertExpiry}</th>
                <th>{t.columnLastLogin}</th>
                <th className="adm-text-right">{t.columnActions}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((acc) => {
                const statusMeta = getAccountStatusMeta(acc.status, lang)
                const certLabel = acc.certExpiry
                  ? certDaysLeftLabel(acc.certExpiry, lang)
                  : null
                return (
                  <tr key={acc.id}>
                    <td>
                      <div className="adm-cell-user">
                        <span className="odm-adm-avatar" aria-hidden="true">
                          {acc.fullName
                            .split(' ')
                            .slice(-2)
                            .map((w) => w[0])
                            .join('')
                            .toUpperCase()}
                        </span>
                        <div>
                          <a
                            className="adm-list-link"
                            href={adminHref({
                              screen: 'accountDetail',
                              accountId: acc.id,
                            })}
                          >
                            {acc.fullName}
                          </a>
                          <div className="adm-cell-email">{acc.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <RoleCodeBadge role={acc.role} />
                    </td>
                    <td>
                      <StatusBadge tone={toAdminTone(statusMeta.tone)}>
                        {statusMeta.label}
                      </StatusBadge>
                      {!acc.emailVerified && (
                        <div className="odm-adm-subnote odm-adm-subnote-warn">
                          {t.unverifiedEmail}
                        </div>
                      )}
                    </td>
                    <td className={acc.certExpiry ? undefined : 'adm-muted'}>
                      {acc.certExpiry ? (
                        <>
                          {fmtDate(acc.certExpiry, lang)}
                          {certLabel && (
                            <div className="odm-adm-subnote odm-adm-subnote-cert">
                              {certLabel}
                            </div>
                          )}
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="adm-cell-mono">
                      {acc.lastLoginAt
                        ? fmtDateTime(acc.lastLoginAt, lang)
                        : '—'}
                    </td>
                    <td>
                      <AccountActions
                        account={acc}
                        onChangeRole={() =>
                          setDialog({ type: 'changeRole', account: acc })
                        }
                        onLock={() => setDialog({ type: 'lock', account: acc })}
                        onResetPassword={() =>
                          setDialog({ type: 'resetPwd', account: acc })
                        }
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </TableCard>
      )}

      {dialog?.type === 'changeRole' && (
        <ChangeRoleDialog
          account={dialog.account}
          onClose={() => setDialog(null)}
          onSuccess={handleDialogSuccess}
        />
      )}
      {dialog?.type === 'lock' && (
        <LockAccountDialog
          account={dialog.account}
          onClose={() => setDialog(null)}
          onSuccess={handleDialogSuccess}
        />
      )}
      {dialog?.type === 'resetPwd' && (
        <ResetPasswordDialog
          account={dialog.account}
          onClose={() => setDialog(null)}
          onSuccess={handleDialogSuccess}
        />
      )}
    </div>
  )
}
