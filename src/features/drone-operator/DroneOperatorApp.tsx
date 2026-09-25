import { useEffect, useState } from 'react'

import { useApiQuery } from '../../shared/hooks/useApiQuery'
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
  getActiveMissionFlowStep,
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
  const guardedRoute = guardOperatorFlowRoute(
    route,
    getActiveMissionId(),
    getActiveMissionFlowStep(),
  )

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
    return <ActiveFlightScreen missionId={route.missionId} />
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
      {renderScreen(route, searchQuery)}
    </OperatorLayout>
  )
}

function renderScreen(route: OperatorRoute, searchQuery: string) {
  if (route.screen === 'missions')
    return <MissionListPage searchQuery={searchQuery} />
  if (route.screen === 'missionDetail')
    return <MissionDetailScreen missionId={route.missionId} />
  if (route.screen === 'availability') return <AvailabilityScreen />
  if (route.screen === 'connect') return <ConnectDroneScreen missionId={route.missionId} />
  if (route.screen === 'handover') return <HandoverScreen missionId={route.missionId} />
  if (route.screen === 'preflight') return <PreflightScreen missionId={route.missionId} />
  if (route.screen === 'upload') return <UploadMediaScreen missionId={route.missionId} />
  if (route.screen === 'postflight') return <PostflightScreen missionId={route.missionId} />
  if (route.screen === 'maintenance') return <OperatorMaintenanceScreen />
  if (route.screen === 'zoneMap') return <SimulationZonesScreen />
  return (
    <PlaceholderPage
      title={operatorActiveLabel(route.screen) || 'Không tìm thấy'}
    />
  )
}
