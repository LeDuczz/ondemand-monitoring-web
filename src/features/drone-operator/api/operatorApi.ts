import { apiRequest } from '../../../shared/api/httpClient'
import { authSession } from '../../auth/api/authApi'
import { missionApi } from '../../mission/api/missionApi'
import { toOperatorMission, type BackendMission } from './liveMission'
import type { AvailabilityStatus } from '../lib/availabilitySlots'
import type {
  OperatorMission,
  OperatorMissionTab,
  OperatorProfile,
} from '../types/mission'

export const operatorApi = {
  getProfile: async (_signal?: AbortSignal): Promise<OperatorProfile> => {
    const user = authSession.getUser()
    if (!user) throw new Error('Please sign in as a drone operator')
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      rank: '',
      station: '',
      certExpiry: '',
    }
  },

  listMissions: async (tab?: OperatorMissionTab, _signal?: AbortSignal) => {
    const missions = await missionApi.getMyMissions() as unknown as BackendMission[]
    const items = missions.map(toOperatorMission)
    if (!tab) return { items }
    const statuses: Record<OperatorMissionTab, OperatorMission['status'][]> = {
      pending: ['PENDING'], upcoming: ['ACCEPTED', 'IN_FLIGHT'],
      history: ['COMPLETED', 'REJECTED', 'FAILED'],
    }
    return { items: items.filter((item) => statuses[tab].includes(item.status)) }
  },

  getMission: async (missionId: string, _signal?: AbortSignal) =>
    toOperatorMission(await missionApi.getMissionById(missionId) as unknown as BackendMission),

  acceptMission: async (missionId: string, _signal?: AbortSignal) =>
    toOperatorMission(await missionApi.acceptMyMission(missionId) as unknown as BackendMission),

  rejectMission: async (
    missionId: string,
    body: { reason: string; notes?: string },
    _signal?: AbortSignal,
  ) =>
    toOperatorMission(await missionApi.rejectMyMission(missionId, body.reason) as unknown as BackendMission),

  getAvailability: (week: string, signal?: AbortSignal) =>
    apiRequest<{ week: string; slots: Record<string, AvailabilityStatus> }>(
      `/api/operator/availability?week=${week}`,
      { signal },
    ),

  saveAvailability: (
    body: { week: string; slots: Record<string, AvailabilityStatus> },
    signal?: AbortSignal,
  ) =>
    apiRequest<{ week: string; slots: Record<string, AvailabilityStatus> }>(
      '/api/operator/availability',
      {
        method: 'PUT',
        body,
        signal,
      },
    ),

}
