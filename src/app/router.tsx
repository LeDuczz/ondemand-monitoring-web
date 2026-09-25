import '../styles/global.css'
import '../styles/odm.css'

import { useEffect, useState, type ReactNode } from 'react'

import { AuthPage } from '../features/auth/pages/AuthPage'
import { LandingPage } from '../features/landing/pages/LandingPage'
import { SocialCallbackPage } from '../features/auth/pages/SocialCallbackPage'
import { authSession } from '../features/auth/api/authApi'
import { getRoleHomePath } from '../features/auth/routing'
import type { UserRole } from '../features/auth/types'
import { CustomerApp } from '../features/customer/CustomerApp'
import { CustomerCreateRequestPage } from '../features/customer/pages/CustomerCreateRequestPage'
import { ManagerApp } from '../features/manager/ManagerApp'
import { StaffAssignmentPage } from '../features/staff/pages/StaffAssignmentPage'
import { DroneOperatorHomePage } from '../features/drone-operator/pages/DroneOperatorHomePage'
import { SystemOperatorHomePage } from '../features/system-operator/pages/SystemOperatorHomePage'
import { AdminApp } from '../features/admin/AdminApp'
import { OperatorDashboardPage } from '../features/mission/pages/OperatorDashboardPage'

function RoleRoute({ role, children }: { role: UserRole; children: ReactNode }) {
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

  if (pathname === '/social/callback') return <SocialCallbackPage />
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
  if (hash === '#portal/staff/assignments')
    return (
      <RoleRoute role="STAFF">
        <StaffAssignmentPage />
      </RoleRoute>
    )
  if (hash === '#portal/staff' || hash.startsWith('#portal/staff/'))
    return (
      <RoleRoute role="STAFF">
        <ManagerApp />
      </RoleRoute>
    )
  if (hash === '#portal/drone-operator' || hash.startsWith('#portal/drone-operator/'))
    return (
      <RoleRoute role="DRONE_OPERATOR">
        <DroneOperatorHomePage />
      </RoleRoute>
    )
  if (hash === '#portal/system-operator' || hash.startsWith('#portal/system-operator/'))
    return (
      <RoleRoute role="SYSTEM_OPERATOR">
        <SystemOperatorHomePage />
      </RoleRoute>
    )
  if (hash === '#portal/admin' || hash.startsWith('#portal/admin/'))
    return (
      <RoleRoute role="ADMIN">
        <AdminApp />
      </RoleRoute>
    )
  if (hash === '#operator') return <OperatorDashboardPage />

  return <LandingPage />
}
