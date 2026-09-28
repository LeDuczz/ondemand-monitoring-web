import {
  ErrorState,
  LoadingState,
} from '../../../shared/components/odm/StateView'
import { StatusBadge } from '../../../shared/components/odm/StatusBadge'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../shared/i18n'
import { adminApi } from '../api/adminApi'
import {
  getAccountStatusMeta,
  fmtDate,
  getRoleLabel,
} from '../lib/accountStatus'
import { adminHref } from '../routes'
import { adminDashboardPageMessages } from './AdminDashboardPage.messages'

export function AdminDashboardPage() {
  const { t, lang } = useI18n(adminDashboardPageMessages)
  const { data, loading, error, reload } = useApiQuery(
    (signal) => adminApi.getDashboard(signal),
    [],
  )

  if (loading) return <LoadingState />
  if (error || !data) return <ErrorState error={error} onRetry={reload} />

  const roleOrder = [
    'ADMIN',
    'STAFF',
    'DRONE_OPERATOR',
    'SYSTEM_OPERATOR',
    'CUSTOMER',
  ]

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
        }}
      >
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{t.title}</h1>
        <a
          className="odm-btn odm-btn-p"
          href={adminHref({ screen: 'createAccount' })}
        >
          {t.createAccount}
        </a>
      </div>

      {/* KPI cards */}
      <div className="odm-adm-kpi-row">
        <div className="odm-adm-kpi-card">
          <div className="odm-adm-kpi-label">{t.totalAccounts}</div>
          <div className="odm-adm-kpi-value">{data.totalAccounts}</div>
          <div className="odm-adm-kpi-sub">{t.systemWide}</div>
        </div>
        <div className="odm-adm-kpi-card">
          <div className="odm-adm-kpi-label">{t.active}</div>
          <div
            className="odm-adm-kpi-value"
            style={{ color: 'var(--green-solid, #22c55e)' }}
          >
            {data.activeAccounts}
          </div>
          <div className="odm-adm-kpi-sub">{t.accountsUnit}</div>
        </div>
        <div className="odm-adm-kpi-card">
          <div className="odm-adm-kpi-label">{t.pendingVerification}</div>
          <div
            className="odm-adm-kpi-value"
            style={{
              color:
                data.pendingAccounts > 0
                  ? 'var(--yellow-solid, #eab308)'
                  : undefined,
            }}
          >
            {data.pendingAccounts}
          </div>
          <div className="odm-adm-kpi-sub">{t.accountsUnit}</div>
        </div>
        <div className="odm-adm-kpi-card">
          <div className="odm-adm-kpi-label">{t.inactive}</div>
          <div className="odm-adm-kpi-value">{data.inactiveAccounts}</div>
          <div className="odm-adm-kpi-sub">{t.accountsUnit}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* By role */}
        <div
          style={{
            background: 'var(--sf)',
            border: '1px solid var(--bd)',
            borderRadius: 10,
            padding: '16px 20px',
          }}
        >
          <h2 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 600 }}>
            {t.byRole}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {roleOrder
              .filter((r) => data.byRole[r])
              .map((r) => {
                const count = data.byRole[r] ?? 0
                const pct = Math.round((count / data.totalAccounts) * 100)
                return (
                  <div key={r}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: 12,
                        marginBottom: 4,
                      }}
                    >
                      <span>
                        {getRoleLabel(
                          r as Parameters<typeof getRoleLabel>[0],
                          lang,
                        ) ?? r}
                      </span>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--tx2)',
                        }}
                      >
                        {count}
                      </span>
                    </div>
                    <div
                      style={{
                        height: 6,
                        borderRadius: 99,
                        background: 'var(--sf3)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${pct}%`,
                          background: 'var(--ink)',
                          borderRadius: 99,
                          transition: 'width 0.3s',
                        }}
                      />
                    </div>
                  </div>
                )
              })}
          </div>
        </div>

        {/* Recent accounts */}
        <div
          style={{
            background: 'var(--sf)',
            border: '1px solid var(--bd)',
            borderRadius: 10,
            padding: '16px 20px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}
          >
            <h2 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
              {t.latestAccounts}
            </h2>
            <a
              href={adminHref({ screen: 'accounts' })}
              style={{
                fontSize: 12,
                color: 'var(--blue-solid)',
                textDecoration: 'none',
              }}
            >
              {t.viewAll}
            </a>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data.recentAccounts.map((acc) => {
              const meta = getAccountStatusMeta(acc.status, lang)
              return (
                <div
                  key={acc.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 0',
                    borderBottom: '1px solid var(--bd)',
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: 'var(--sf3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontWeight: 700,
                      flex: 'none',
                    }}
                  >
                    {(acc.fullName[0] ?? '?').toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <a
                      href={adminHref({
                        screen: 'accountDetail',
                        accountId: acc.id,
                      })}
                      style={{
                        color: 'var(--tx)',
                        textDecoration: 'none',
                        fontWeight: 600,
                        fontSize: 13,
                        display: 'block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {acc.fullName}
                    </a>
                    <div style={{ fontSize: 11, color: 'var(--tx3)' }}>
                      {fmtDate(acc.createdAt, lang)}
                    </div>
                  </div>
                  <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
