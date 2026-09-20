import { useEffect, useState } from 'react'

import { useApiQuery } from '../../shared/hooks/useApiQuery'

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
import { AdminDashboardPage } from './pages/AdminDashboardPage'
import { AccountsPage } from './pages/AccountsPage'
import { CreateAccountPage } from './pages/CreateAccountPage'
import { AccountDetailPage } from './pages/AccountDetailPage'
import type { AdminRoute } from './routes'

const BREADCRUMB: Record<AdminRoute['screen'], string> = {
  dashboard: 'Tổng quan',
  accounts: 'Tài khoản',
  createAccount: 'Tạo tài khoản',
  accountDetail: 'Chi tiết tài khoản',
  notFound: 'Không tìm thấy',
}

function renderScreen(route: AdminRoute) {
  switch (route.screen) {
    case 'dashboard':
      return <AdminDashboardPage />
    case 'accounts':
      return <AccountsPage />
    case 'createAccount':
      return <CreateAccountPage />
    case 'accountDetail':
      return <AccountDetailPage accountId={route.accountId} />
    default:
      return (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--tx3)' }}>
          Trang không tồn tại.
        </div>
      )
  }
}

export function AdminApp() {
  const hash = useHash()
  const route = parseAdminRoute(hash)

  const { data } = useApiQuery((signal) => adminApi.getDashboard(signal), [])
  const pendingCount = data?.pendingAccounts

  return (
    <AdminLayout
      route={route}
      breadcrumb={BREADCRUMB[route.screen]}
      pendingCount={pendingCount}
    >
      {renderScreen(route)}
    </AdminLayout>
  )
}
