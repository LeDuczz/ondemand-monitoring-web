import '../styles/global.css'

import { useEffect, useState, type ReactNode } from 'react'

import { AuthPage } from '../features/auth/pages/AuthPage'
import { LandingPage } from '../features/landing/pages/LandingPage'
import { SocialCallbackPage } from '../features/auth/pages/SocialCallbackPage'
import { authSession } from '../features/auth/api/authApi'
import { getRoleHomePath } from '../features/auth/routing'
import type { UserRole } from '../features/auth/types'
import { CustomerHomePage } from '../features/customer/pages/CustomerHomePage'
import { StaffHomePage } from '../features/staff/pages/StaffHomePage'
import { DroneOperatorHomePage } from '../features/drone-operator/pages/DroneOperatorHomePage'
import { SystemOperatorHomePage } from '../features/system-operator/pages/SystemOperatorHomePage'
import { AdminHomePage } from '../features/admin/pages/AdminHomePage'
import { AdminAccountCreatePage } from '../features/admin/pages/AdminAccountCreatePage'
import { OperatorDashboardPage } from '../features/mission/pages/OperatorDashboardPage'

function RoleRoute({
  role,
  children,
}: {
  role: UserRole
  children: ReactNode
}) {
  const user = authSession.getUser()
  if (!authSession.getAccessToken() || !user) {
    window.location.hash = '#auth/login'
    return null
  }
  if (user.role !== role) {
    window.location.hash = getRoleHomePath(user.role)
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

  if (pathname === '/social/callback') {
    return <SocialCallbackPage />
  }
  if (hash === '#auth/register') return <AuthPage initialMode="register" />
  if (hash === '#auth/login') return <AuthPage initialMode="login" />
  if (hash === '#portal/customer')
    return (
      <RoleRoute role="CUSTOMER">
        <CustomerHomePage />
      </RoleRoute>
    )
  if (hash === '#portal/staff')
    return (
      <RoleRoute role="STAFF">
        <StaffHomePage />
      </RoleRoute>
    )
  if (hash === '#portal/drone-operator')
    return (
      <RoleRoute role="DRONE_OPERATOR">
        <DroneOperatorHomePage />
      </RoleRoute>
    )
  if (hash === '#portal/system-operator')
    return (
      <RoleRoute role="SYSTEM_OPERATOR">
        <SystemOperatorHomePage />
      </RoleRoute>
    )
  if (hash === '#portal/admin')
    return (
      <RoleRoute role="ADMIN">
        <AdminHomePage />
      </RoleRoute>
    )
  if (hash === '#portal/admin/accounts/new')
    return (
      <RoleRoute role="ADMIN">
        <AdminAccountCreatePage />
      </RoleRoute>
    )
  if (hash === '#operator') return <OperatorDashboardPage />

  return <LandingPage />
}
