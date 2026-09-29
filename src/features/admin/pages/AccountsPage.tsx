import { useMemo, useState } from 'react'

import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '../../../shared/components/odm/StateView'
import { StatusBadge } from '../../../shared/components/odm/StatusBadge'
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
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 700,
              lineHeight: 1.3,
            }}
          >
            {t.title}
          </h1>
          {data && (
            <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--tx3)' }}>
              {accountsSubtitle(computeAccountCounts(data.items), lang)}
            </p>
          )}
        </div>
        <a
          className="odm-btn odm-btn-p"
          href={adminHref({ screen: 'createAccount' })}
        >
          {t.createInternal}
        </a>
      </div>

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
                <th>{t.columnUser}</th>
                <th>{t.columnRole}</th>
                <th>{t.columnStatus}</th>
                <th>{t.columnCertExpiry}</th>
                <th>{t.columnLastLogin}</th>
                <th style={{ textAlign: 'right' }}>{t.columnActions}</th>
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
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <span
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: 'var(--sf3)',
                            border: '1px solid var(--bd)',
                            color: 'var(--tx2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 11,
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                          aria-hidden="true"
                        >
                          {acc.fullName
                            .split(' ')
                            .slice(-2)
                            .map((w) => w[0])
                            .join('')
                            .toUpperCase()}
                        </span>
                        <div>
                          <a
                            href={adminHref({
                              screen: 'accountDetail',
                              accountId: acc.id,
                            })}
                            style={{
                              color: 'var(--tx)',
                              textDecoration: 'none',
                              fontWeight: 500,
                              fontSize: 13,
                            }}
                          >
                            {acc.fullName}
                          </a>
                          <div style={{ fontSize: 11, color: 'var(--tx3)' }}>
                            {acc.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <RoleCodeBadge role={acc.role} />
                    </td>
                    <td>
                      <StatusBadge tone={statusMeta.tone}>
                        {statusMeta.label}
                      </StatusBadge>
                      {!acc.emailVerified && (
                        <div className="odm-adm-subnote odm-adm-subnote-warn">
                          {t.unverifiedEmail}
                        </div>
                      )}
                    </td>
                    <td
                      style={{
                        fontSize: 12,
                        color: acc.certExpiry ? 'var(--tx2)' : 'var(--tx3)',
                      }}
                    >
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
                    <td
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 11,
                        color: 'var(--tx3)',
                      }}
                    >
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
          <div
            style={{
              padding: '10px 14px',
              fontSize: 12,
              color: 'var(--tx3)',
              borderTop: '1px solid var(--bd)',
            }}
          >
            {pageRangeLabel(filtered.length, filtered.length, lang)}
          </div>
        </div>
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
