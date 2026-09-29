import { useI18n } from '../../../../../shared/i18n'
import type { AdminAccountItem } from '../../../types/accounts'
import { Card } from '../../../components/common/Card'
import { MockDataBadge } from '../../../components/common/MockDataBadge'
import {
  StatusBadge,
  toAdminTone,
} from '../../../components/common/StatusBadge'
import { fmtDate, getAccountStatusMeta } from '../../../lib/accountStatus'
import { adminHref } from '../../../routes'
import { adminDashboardPageMessages } from '../AdminDashboardPage.messages'

/** Latest accounts: still backed by the mock dashboard endpoint. */
export function RecentAccountsCard({
  accounts,
}: {
  accounts: AdminAccountItem[]
}) {
  const { t, lang } = useI18n(adminDashboardPageMessages)
  return (
    <Card
      title={
        <>
          {t.latestAccounts} <MockDataBadge />
        </>
      }
      actions={<a href={adminHref({ screen: 'accounts' })}>{t.viewAll}</a>}
    >
      <div className="adm-list">
        {accounts.map((acc) => {
          const meta = getAccountStatusMeta(acc.status, lang)
          return (
            <div key={acc.id} className="adm-list-row">
              <div className="odm-adm-avatar" aria-hidden="true">
                {(acc.fullName[0] ?? '?').toUpperCase()}
              </div>
              <div className="adm-list-main">
                <a
                  className="adm-list-link"
                  href={adminHref({
                    screen: 'accountDetail',
                    accountId: acc.id,
                  })}
                >
                  {acc.fullName}
                </a>
                <div className="adm-list-sub">{fmtDate(acc.createdAt, lang)}</div>
              </div>
              <StatusBadge tone={toAdminTone(meta.tone)}>{meta.label}</StatusBadge>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
