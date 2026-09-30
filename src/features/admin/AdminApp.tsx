import { useEffect, useState } from 'react'

import { useApiQuery } from '../../shared/hooks/useApiQuery'
import { useI18n } from '../../shared/i18n'
import { adminAppMessages } from './AdminApp.messages'

function useHash(): string {
  const [hash, setHash] = useState(() => window.location.hash)
  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])
  return hash
}
import { adminApi } from './api/adminApi'
import { AdminLayout } from './AdminLayout'
import { parseAdminRoute } from './routes'
import { AdminDashboardPage } from './pages/Dashboard'
import { AccountsPage } from './pages/Accounts'
import { AccountDetailPage } from './pages/AccountDetail'
import { RolesPage } from './pages/Roles'
import { CatalogPage } from './pages/Catalog'
import { OperatingConfigPage } from './pages/OperatingConfig'
import { AiKnowledgePage } from './pages/AiKnowledge'
import { AuditLogPage } from './pages/AuditLog'
import type { AdminRoute } from './routes'

function renderScreen(route: AdminRoute, notFoundText: string) {
  switch (route.screen) {
    case 'dashboard':
      return <AdminDashboardPage />
    case 'accounts':
      return <AccountsPage />
    case 'createAccount':
      return <AccountsPage openCreate />
    case 'accountDetail':
      return <AccountDetailPage accountId={route.accountId} />
    case 'roles':
      return <RolesPage />
    case 'catalog':
      return <CatalogPage />
    case 'operatingConfig':
      return <OperatingConfigPage />
    case 'aiKnowledge':
      return <AiKnowledgePage />
    case 'auditLog':
      return <AuditLogPage />
    default:
      return (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--tx3)' }}>
          {notFoundText}
        </div>
      )
  }
}

export function AdminApp() {
  const hash = useHash()
  const route = parseAdminRoute(hash)
  const { t } = useI18n(adminAppMessages)

  const { data } = useApiQuery((signal) => adminApi.getDashboard(signal), [])
  const pendingCount = data?.pendingAccounts

  return (
    <AdminLayout
      route={route}
      breadcrumb={t.breadcrumb[route.screen]}
      pendingCount={pendingCount}
    >
      {renderScreen(route, t.notFoundPage)}
    </AdminLayout>
  )
}
