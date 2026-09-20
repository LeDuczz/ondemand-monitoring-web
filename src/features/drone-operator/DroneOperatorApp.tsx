import { useEffect, useState } from 'react'

import { useApiQuery } from '../../shared/hooks/useApiQuery'
import { operatorApi } from './api/operatorApi'
import { missionsByTab } from './lib/filterMissions'
import { demoNow } from './lib/demoNow'
import { OperatorLayout } from './OperatorLayout'
import { DRONE_PRIMARY, MISSION_PRIMARY } from './omss/mockData'
import SimulationZonesScreen from './omss/screens/SimulationZones'
import InFlightControlScreen from './omss/screens/InFlightControl'
import { MissionDetailScreen } from './pages/MissionDetailScreen'
import { MissionListPage } from './pages/MissionListPage'
import { PlaceholderPage } from './pages/PlaceholderPage'
import { AvailabilityScreen } from './pages/AvailabilityScreen'
import { ConnectDroneScreen } from './pages/ConnectDroneScreen'
import { HandoverScreen } from './pages/HandoverScreen'
import { PostflightScreen } from './pages/PostflightScreen'
import { PreflightScreen } from './pages/PreflightScreen'
import { UploadMediaScreen } from './pages/UploadMediaScreen'
import { operatorActiveLabel } from './OperatorSidebar'
import { parseOperatorRoute, type OperatorRoute } from './routes'

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

  // Buồng lái renders full-screen without the shell, same as OMSS.
  if (route.screen === 'flight') {
    return (
      <InFlightControlScreen
        mission={MISSION_PRIMARY}
        drone={DRONE_PRIMARY}
        onRTB={() => {
          window.location.hash = '#portal/drone-operator/postflight'
        }}
        onEmergency={() => {}}
      />
    )
  }

  return (
    <OperatorLayout
      route={route}
      pendingCount={pendingCount}
      notificationCount={2}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
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
  if (route.screen === 'connect') return <ConnectDroneScreen />
  if (route.screen === 'handover') return <HandoverScreen />
  if (route.screen === 'preflight') return <PreflightScreen />
  if (route.screen === 'upload') return <UploadMediaScreen />
  if (route.screen === 'postflight') return <PostflightScreen />
  if (route.screen === 'zoneMap') return <SimulationZonesScreen />
  return (
    <PlaceholderPage
      title={operatorActiveLabel(route.screen) || 'Không tìm thấy'}
    />
  )
}
