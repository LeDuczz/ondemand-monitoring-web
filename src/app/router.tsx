import '../styles/global.css'
import '../styles/odm.css'

import { useEffect, useState, type ReactNode } from 'react'

import { UserProfilePage } from '../features/user/pages/UserProfilePage'
import { AuthPage } from '../features/auth/pages/AuthPage'
import { LandingPage } from '../features/landing/pages/LandingPage'
import { SocialCallbackPage } from '../features/auth/pages/SocialCallbackPage'
import { authSession } from '../features/auth/api/authApi'
import { getRoleHomePath } from '../features/auth/routing'
import type { UserRole } from '../features/auth/types'
import { CustomerApp } from '../features/customer/CustomerApp'
import {
  CustomerLayout,
  type CustomerNavItemKey,
} from '../features/customer/CustomerLayout'
import { customerLayoutMessages } from '../features/customer/CustomerLayout.messages'
import { useI18n } from '../shared/i18n'
import { CustomerCreateRequestPage } from '../features/customer/pages/CustomerCreateRequest'
import { ManagerApp } from '../features/manager/ManagerApp'
import { DroneOperatorHomePage } from '../features/drone-operator/pages/DroneOperatorHomePage'
import { AdminApp } from '../features/admin/AdminApp'
import { OperatorDashboardPage } from '../features/mission/pages/OperatorDashboardPage'
import { HelpCenterHomePage } from '../features/support/pages/HelpCenterHome'
import { CustomerTicketsListPage } from '../features/support/pages/CustomerTicketsList'
import { CustomerTicketDetailPage } from '../features/support/pages/CustomerTicketDetail'

function redirectHash(to: string) {
  if (window.location.hash !== to) {
    window.location.hash = to
  }
  window.setTimeout(() => {
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  }, 0)
}

function RoleRoute({
  role,
  children,
}: {
  role: UserRole
  children: ReactNode
}) {
  const user = authSession.getUser()
  if (!authSession.getAccessToken() || !user) {
    redirectHash('#auth/login')
    return null
  }
  if (user.role !== role) {
    redirectHash(getRoleHomePath(user.role))
    return null
  }
  return children
}

function SupportShell({
  crumb,
  children,
}: {
  crumb: 'help' | 'tickets' | 'ticketDetail'
  children: ReactNode
}) {
  const { t } = useI18n(customerLayoutMessages)
  const activeNavItem: CustomerNavItemKey =
    crumb === 'help' ? 'help' : 'support'
  return (
    <CustomerLayout
      route={{ screen: 'dashboard' }}
      breadcrumb={t.supportCrumbs[crumb]}
      activeNavItem={activeNavItem}
    >
      {children}
    </CustomerLayout>
  )
}

function AuthRoute({ children }: { children: ReactNode }) {
  if (!authSession.getAccessToken() || !authSession.getUser()) {
    redirectHash('#auth/login')
    return null
  }
  return children
}

export function Router() {
  const [hash, setHash] = useState(() => window.location.hash)
  const [pathname, setPathname] = useState(() => window.location.pathname)

  useEffect(() => {
    const handleHashChange = () => setHash(window.location.hash)
    const handleNavigation = () => setPathname(window.location.pathname)
    window.addEventListener('hashchange', handleHashChange)
    window.addEventListener('popstate', handleNavigation)
    return () => {
      window.removeEventListener('hashchange', handleHashChange)
      window.removeEventListener('popstate', handleNavigation)
    }
  }, [])

  if (hash.startsWith('#help/tickets/')) {
    const ticketId = hash.replace('#help/tickets/', '')
    return (
      <AuthRoute>
        <SupportShell crumb="ticketDetail">
          <CustomerTicketDetailPage ticketId={ticketId} />
        </SupportShell>
      </AuthRoute>
    )
  }
  if (hash === '#help/tickets')
    return (
      <AuthRoute>
        <SupportShell crumb="tickets">
          <CustomerTicketsListPage />
        </SupportShell>
      </AuthRoute>
    )
  if (hash === '#help' || hash.startsWith('#help/'))
    return (
      <AuthRoute>
        <SupportShell crumb="help">
          <HelpCenterHomePage />
        </SupportShell>
      </AuthRoute>
    )

  if (pathname === '/social/callback') return <SocialCallbackPage />
  if (hash === '#profile')
    return (
      <AuthRoute>
        <UserProfilePage />
      </AuthRoute>
    )
  if (hash === '#auth/register')
    return <AuthPage key="register" initialMode="register" />
  if (hash === '#auth/login')
    return <AuthPage key="login" initialMode="login" />
  if (hash === '#portal/customer/request')
    return (
      <RoleRoute role="CUSTOMER">
        <CustomerCreateRequestPage />
      </RoleRoute>
    )
  if (hash === '#portal/customer' || hash.startsWith('#portal/customer/'))
    return (
      <RoleRoute role="CUSTOMER">
        <CustomerApp />
      </RoleRoute>
    )
  if (hash === '#portal/manager' || hash.startsWith('#portal/manager/'))
    return (
      <RoleRoute role="MANAGER">
        <ManagerApp />
      </RoleRoute>
    )
  if (hash === '#portal/staff' || hash.startsWith('#portal/staff/'))
    return (
      <RoleRoute role="STAFF">
        <DroneOperatorHomePage />
      </RoleRoute>
    )
  if (hash === '#portal/admin' || hash.startsWith('#portal/admin/'))
    return (
      <RoleRoute role="ADMIN">
        <AdminApp />
      </RoleRoute>
    )
  if (hash === '#operator')
    return (
      <RoleRoute role="STAFF">
        <OperatorDashboardPage />
      </RoleRoute>
    )

  return <LandingPage />
}
