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
import { RolesPage } from './pages/RolesPage'
import { CatalogPage } from './pages/CatalogPage'
import { OperatingConfigPage } from './pages/OperatingConfigPage'
import { AiKnowledgePage } from './pages/AiKnowledgePage'
import { AuditLogPage } from './pages/AuditLogPage'
import type { AdminRoute } from './routes'

const BREADCRUMB: Record<AdminRoute['screen'], string> = {
  dashboard: 'Tổng quan',
  accounts: 'Người dùng',
  createAccount: 'Tạo tài khoản',
  accountDetail: 'Chi tiết tài khoản',
  roles: 'Vai trò',
  catalog: 'Danh mục',
  operatingConfig: 'Cấu hình vận hành',
  aiKnowledge: 'Tri thức AI và luật',
  auditLog: 'Nhật ký hệ thống',
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
