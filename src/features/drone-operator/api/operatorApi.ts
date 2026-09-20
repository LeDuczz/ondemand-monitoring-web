import { apiRequest } from '../../../shared/api/httpClient'
import type { AvailabilityStatus } from '../lib/availabilitySlots'
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

  acceptMission: (missionId: string, signal?: AbortSignal) =>
    apiRequest<OperatorMission>(`/api/operator/missions/${missionId}/accept`, {
      method: 'POST',
      signal,
    }),

  rejectMission: (
    missionId: string,
    body: { reason: string; notes?: string },
    signal?: AbortSignal,
  ) =>
    apiRequest<OperatorMission>(`/api/operator/missions/${missionId}/reject`, {
      method: 'POST',
      body,
      signal,
    }),

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
