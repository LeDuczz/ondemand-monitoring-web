import { apiRequest } from '../../../shared/api/httpClient'
import type { OperatorMission, OperatorMissionTab, OperatorProfile } from '../types/mission'

export const operatorApi = {
  getProfile: (signal?: AbortSignal) =>
    apiRequest<OperatorProfile>('/api/operator/profile', { signal }),

  listMissions: (tab?: OperatorMissionTab, signal?: AbortSignal) => {
    const query = tab ? `?tab=${tab}` : ''
    return apiRequest<{ items: OperatorMission[] }>(`/api/operator/missions${query}`, {
      signal,
    })
  },

  getMission: (missionId: string, signal?: AbortSignal) =>
    apiRequest<OperatorMission>(`/api/operator/missions/${missionId}`, { signal }),
}
