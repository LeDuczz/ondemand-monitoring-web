import { useState } from 'react'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { missionApi } from '../../mission/api/missionApi'
import { clearActiveMissionId, getActiveMissionId, setActiveMissionId, type BackendMission } from './liveMission'

export function isSelectableMission(status?: string | null) {
  return (
    status === 'POSTFLIGHT_CHECKING' ||
    status === 'RETURNING' ||
    status === 'IN_FLIGHT' ||
    status === 'IN_PROGRESS' ||
    status === 'SCHEDULED' ||
    status === 'CONNECTED' ||
    status === 'PREFLIGHT_CHECKING' ||
    status === 'READY_TO_FLY' ||
    status === 'FAILED_PREFLIGHT' ||
    status === 'ACCEPTED'
  )
}

function hasAssignedDrone(mission?: BackendMission) {
  return Boolean(mission?.droneCode || mission?.droneId)
}

export function mergeMissionSnapshot(
  detail?: BackendMission,
  listItem?: BackendMission,
): BackendMission | undefined {
  if (!detail) return listItem
  if (!listItem) return detail

  return {
    ...listItem,
    ...detail,
    droneId: detail.droneId ?? listItem.droneId ?? null,
    droneCode: detail.droneCode ?? listItem.droneCode ?? null,
    plan: detail.plan ?? listItem.plan ?? null,
  }
}

export function useActiveMission(paramMissionId?: string) {
  const [selectedId, setSelectedId] = useState<string | null>(() => getActiveMissionId())

  const myMissionsQuery = useApiQuery(
    async () => {
      const list = (await missionApi.getMyMissions()) as unknown as BackendMission[]
      return list || []
    },
    [],
  )

  const allMissions = myMissionsQuery.data || []

  // Candidate missions in active or postflight statuses
  const postflightMissions = allMissions.filter(
    (m) => m.status === 'POSTFLIGHT_CHECKING' || m.status === 'RETURNING',
  )
  const activeMissions = allMissions.filter((m) => isSelectableMission(m.status))
  const activeMissionsWithDrone = activeMissions.filter(hasAssignedDrone)

  // Resolve target mission ID:
  // 1. Explicit parameter
  // 2. Currently selectedId if it exists in allMissions
  // 3. First postflight mission if available
  // 4. First active mission
  // 5. First mission from list
  let targetId = paramMissionId || ''
  if (
    !targetId &&
    selectedId &&
    allMissions.some((m) => m.id === selectedId && isSelectableMission(m.status))
  ) {
    targetId = selectedId
  } else if (!paramMissionId && selectedId && allMissions.some((m) => m.id === selectedId)) {
    clearActiveMissionId(selectedId)
  }
  if (!targetId && postflightMissions.length > 0) {
    targetId = postflightMissions[0].id
  }
  if (!targetId && activeMissionsWithDrone.length > 0) {
    targetId = activeMissionsWithDrone[0].id
  }
  if (!targetId && activeMissions.length > 0) {
    targetId = activeMissions[0].id
  }

  // Fetch individual mission details if we have a targetId
  const detailQuery = useApiQuery(
    async () =>
      targetId
        ? ((await missionApi.getMissionById(targetId)) as unknown as BackendMission)
        : undefined,
    [targetId],
  )

  // If we found a targetId and it's not saved in sessionStorage, save it
  if (targetId && !paramMissionId && targetId !== getActiveMissionId()) {
    setActiveMissionId(targetId)
  }

  const handleSelectMission = (id: string) => {
    setSelectedId(id)
    setActiveMissionId(id)
  }

  // Active data can come from detailQuery or matched item in allMissions
  const listMatch = allMissions.find((m) => m.id === targetId)
  const activeData = mergeMissionSnapshot(detailQuery.data, listMatch)

  return {
    data: activeData,
    missionId: targetId,
    loading: myMissionsQuery.loading || detailQuery.loading,
    error: detailQuery.error || myMissionsQuery.error,
    allMissions,
    postflightMissions: postflightMissions.length > 0 ? postflightMissions : allMissions,
    selectMission: handleSelectMission,
  }
}
