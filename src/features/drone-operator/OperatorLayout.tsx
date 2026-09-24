import { useEffect, useState, type ReactNode } from 'react'

import { AiChatWidget } from '../../shared/components/AiChatWidget'
import { OperatorSidebar, operatorActiveLabel } from './OperatorSidebar'
import { OperatorTopbar } from './OperatorTopbar'
import type { OperatorRoute } from './routes'
import './opr.css'

export function OperatorLayout({
  route,
  pendingCount,
  notificationCount,
  searchQuery,
  onSearchChange,
  fillContent,
  children,
}: {
  route: OperatorRoute
  pendingCount?: number
  notificationCount?: number
  searchQuery: string
  onSearchChange: (value: string) => void
  fillContent?: boolean
  children: ReactNode
}) {
  const [dark, setDark] = useState(
    () => document.documentElement.dataset.theme === 'dark',
  )

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  }, [dark])

  return (
    <div className="odm odm-opr">
      <div className="odm-opr-shell">
        <OperatorTopbar
          breadcrumb={operatorActiveLabel(route.screen)}
          dark={dark}
          onToggleDark={() => setDark((v) => !v)}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
        />
        <div className="odm-opr-body">
          <OperatorSidebar
            route={route}
            pendingCount={pendingCount}
            notificationCount={notificationCount}
          />
          <main className="odm-opr-main">
            <div
              className={
                fillContent
                  ? 'odm-opr-content odm-opr-content--fill'
                  : 'odm-opr-content'
              }
            >
              {children}
            </div>
          </main>
        </div>
      </div>
      <AiChatWidget />
    </div>
  )
}
