import { useI18n } from '../../../../../shared/i18n'
import { RoleBadge } from '../../../components/common/RoleBadge'
import { StatusBadge, toAdminTone } from '../../../../../shared/components/ui'
import { fmtDateTime, getAccountStatusMeta } from '../../../lib/accountStatus'
import type { AdminAccountItem } from '../../../types/accounts'
import { AccountActions } from './AccountActions'
import { accountsTableMessages } from './AccountsTable.messages'

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

export function AccountsTable({
  items,
  onEdit,
  onLock,
  onResetPassword,
}: {
  items: AdminAccountItem[]
  onEdit: (a: AdminAccountItem) => void
  onLock: (a: AdminAccountItem) => void
  onResetPassword: (a: AdminAccountItem) => void
}) {
  const { t, lang } = useI18n(accountsTableMessages)
  return (
    <table className="odm-adm-table">
      <thead>
        <tr>
          <th>{t.columnUser}</th>
          <th>{t.columnRole}</th>
          <th>{t.columnStatus}</th>
          <th>{t.columnLastLogin}</th>
          <th className="adm-text-right">{t.columnActions}</th>
        </tr>
      </thead>
      <tbody>
        {items.map((acc) => {
          const meta = getAccountStatusMeta(acc.status, lang)
          return (
            <tr key={acc.id}>
              <td>
                <div className="adm-cell-user">
                  <span className="odm-adm-avatar" aria-hidden="true">
                    {initials(acc.fullName)}
                  </span>
                  <div>
                    <button
                      type="button"
                      className="adm-list-link"
                      onClick={() => onEdit(acc)}
                    >
                      {acc.fullName}
                    </button>
                    <div className="adm-cell-email">{acc.email}</div>
                  </div>
                </div>
              </td>
              <td>
                <RoleBadge role={acc.role} />
              </td>
              <td>
                <StatusBadge tone={toAdminTone(meta.tone)}>
                  {meta.label}
                </StatusBadge>
                {!acc.emailVerified && (
                  <div className="odm-adm-subnote odm-adm-subnote-warn">
                    {t.unverifiedEmail}
                  </div>
                )}
              </td>
              <td className="adm-cell-mono">
                {acc.lastLoginAt ? fmtDateTime(acc.lastLoginAt, lang) : '—'}
              </td>
              <td>
                <AccountActions
                  account={acc}
                  onEdit={() => onEdit(acc)}
                  onLock={() => onLock(acc)}
                  onResetPassword={() => onResetPassword(acc)}
                />
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
