import { useEffect, useState } from 'react'

import '../styles/global.css'

import { AuthPage } from '../features/auth/pages/AuthPage'
import { LandingPage } from '../features/landing/pages/LandingPage'
import { SocialCallbackPage } from '../features/auth/pages/SocialCallbackPage'
import { OperatorDashboardPage } from '../features/mission/pages/OperatorDashboardPage'

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
  if (hash === '#operator') return <OperatorDashboardPage />

  return <LandingPage />
}
