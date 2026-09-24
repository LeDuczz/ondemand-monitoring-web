import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { missionApi } from '../../mission/api/missionApi'
import { getActiveMissionId, type BackendMission } from './liveMission'

export function useActiveMission() {
  const missionId = getActiveMissionId()
  const query = useApiQuery(
    async () => missionId ? missionApi.getMissionById(missionId) as Promise<BackendMission> : undefined,
    [missionId],
  )
  return { ...query, missionId }
}
