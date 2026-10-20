import { UserProfilePage } from '../user/pages/UserProfilePage'
import { StaffSupportDashboardPage } from '../support/pages/StaffSupportDashboardPage'
import { SystemOperatorOverview } from '../system-operator/SystemOperatorOverview'
import { SystemOperatorDevicesScreen } from '../system-operator/pages/SystemOperatorDevicesScreen'
import { MissionActionGuard } from './components/MissionActionGuard'
import { useEffect, useState } from 'react'

import { useApiQuery } from '../../shared/hooks/useApiQuery'
import { useLanguage } from '../../shared/i18n'
import { operatorSidebarMessages } from './OperatorSidebar.messages'
import { operatorApi } from './api/operatorApi'
import { missionsByTab } from './lib/filterMissions'
import { demoNow } from './lib/demoNow'
import { OperatorLayout } from './OperatorLayout'
import SimulationZonesScreen from './omss/screens/SimulationZones'
import { ActiveFlightScreen } from './pages/ActiveFlightScreen'
import { MissionDetailScreen } from './pages/MissionDetailScreen'
import { MissionListPage } from './pages/MissionListPage'
import { PlaceholderPage } from './pages/PlaceholderPage'
import { AvailabilityScreen } from './pages/AvailabilityScreen'
import { ConnectDroneScreen } from './pages/ConnectDroneScreen'
import { HandoverScreen } from './pages/HandoverScreen'
import { PostflightScreen } from './pages/PostflightScreen'
import { PreflightScreen } from './pages/PreflightScreen'
import { UploadMediaScreen } from './pages/UploadMediaScreen'
import { OperatorMaintenanceScreen } from './pages/OperatorMaintenanceScreen'
import { operatorActiveLabel } from './OperatorSidebar'
import {
  guardOperatorFlowRoute,
  operatorFlowStep,
  operatorHref,
  parseOperatorRoute,
  type OperatorRoute,
} from './routes'
import {
  getActiveMissionId,
  markActiveMissionFlowStep,
  setActiveMissionId,
} from './api/liveMission'

function useHash(): string {
  const [hash, setHash] = useState(() => window.location.hash)
  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])
  return hash
}

export function DroneOperatorApp() {
  const hash = useHash()
  const route = parseOperatorRoute(hash)
  const [searchQuery, setSearchQuery] = useState('')
  const { lang } = useLanguage()
  const guardedRoute = guardOperatorFlowRoute(route, getActiveMissionId())

  useEffect(() => {
    if (guardedRoute) {
      window.location.hash = operatorHref(guardedRoute)
      return
    }
    const step = operatorFlowStep(route.screen)
    if (step === null || !('missionId' in route) || !route.missionId) return
    setActiveMissionId(route.missionId)
    markActiveMissionFlowStep(route.missionId, step)
  }, [guardedRoute, route])

  const missionsQuery = useApiQuery(
    (signal) => operatorApi.listMissions(undefined, signal),
    [],
  )
  const now = demoNow()
  const pendingCount = missionsByTab(
    missionsQuery.data?.items ?? [],
    'pending',
    now,
  ).length

  if (guardedRoute) return null

  // Buồng lái renders full-screen without the shell, same as OMSS.
  if (route.screen === 'flight') {
    return (
      <MissionActionGuard
        key={`${route.missionId}:${route.screen}`}
        missionId={route.missionId}
        action="flight"
      >
        <ActiveFlightScreen missionId={route.missionId} />
      </MissionActionGuard>
    )
  }

  return (
    <OperatorLayout
      route={route}
      pendingCount={pendingCount}
      notificationCount={2}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      fillContent={route.screen === 'zoneMap'}
    >
      {renderScreen(route, searchQuery, lang)}
    </OperatorLayout>
  )
}

function renderScreen(
  route: OperatorRoute,
  searchQuery: string,
  lang: 'vi' | 'en',
) {
  if (route.screen === 'missions')
    return <MissionListPage searchQuery={searchQuery} />
  if (route.screen === 'missionDetail')
    return <MissionDetailScreen missionId={route.missionId} />
  if (route.screen === 'availability') return <AvailabilityScreen />
  if (route.screen === 'connect')
    return (
      <MissionActionGuard
        key={`${route.missionId}:${route.screen}`}
        missionId={route.missionId}
        action="connect"
      >
        <ConnectDroneScreen missionId={route.missionId} />
      </MissionActionGuard>
    )
  if (route.screen === 'handover')
    return (
      <MissionActionGuard
        key={`${route.missionId}:${route.screen}`}
        missionId={route.missionId}
        action="handover"
      >
        <HandoverScreen missionId={route.missionId} />
      </MissionActionGuard>
    )
  if (route.screen === 'preflight')
    return (
      <MissionActionGuard
        key={`${route.missionId}:${route.screen}`}
        missionId={route.missionId}
        action="preflight"
      >
        <PreflightScreen missionId={route.missionId} />
      </MissionActionGuard>
    )
  if (route.screen === 'upload')
    return (
      <MissionActionGuard
        key={`${route.missionId}:${route.screen}`}
        missionId={route.missionId}
        action="upload"
      >
        <UploadMediaScreen missionId={route.missionId} />
      </MissionActionGuard>
    )
  if (route.screen === 'postflight')
    return (
      <MissionActionGuard
        key={`${route.missionId}:${route.screen}`}
        missionId={route.missionId}
        action="postflight"
      >
        <PostflightScreen missionId={route.missionId} />
      </MissionActionGuard>
    )
  if (route.screen === 'profile') return <UserProfilePage />
  if (route.screen === 'support') return <StaffSupportDashboardPage />
  if (route.screen === 'technical') return <SystemOperatorOverview />
  if (route.screen === 'devices') return <SystemOperatorDevicesScreen />
  if (route.screen === 'maintenance') return <OperatorMaintenanceScreen />
  if (route.screen === 'zoneMap') return <SimulationZonesScreen />
  return (
    <PlaceholderPage
      title={
        operatorActiveLabel(route.screen, lang) ||
        operatorSidebarMessages[lang].notFoundTitle
      }
    />
  )
}
