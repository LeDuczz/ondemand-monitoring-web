import { apiRequest } from '../../../shared/api/httpClient'
import type { AvailabilityStatus } from '../lib/availabilitySlots'
import type {
  ControlHandover,
  FlightConnection,
  OperatorMission,
  OperatorMissionTab,
  OperatorProfile,
  PreflightItem,
  PreflightRecord,
} from '../types/mission'

export const operatorApi = {
  getProfile: (signal?: AbortSignal) =>
    apiRequest<OperatorProfile>('/api/operator/profile', { signal }),

  listMissions: (tab?: OperatorMissionTab, signal?: AbortSignal) => {
    const query = tab ? `?tab=${tab}` : ''
    return apiRequest<{ items: OperatorMission[] }>(
      `/api/operator/missions${query}`,
      {
        signal,
      },
    )
  },

  getMission: (missionId: string, signal?: AbortSignal) =>
    apiRequest<OperatorMission>(`/api/operator/missions/${missionId}`, {
      signal,
    }),

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

  connectGCS: (
    missionId: string,
    body: { token: string; gcsId: string },
    signal?: AbortSignal,
  ) =>
    apiRequest<FlightConnection>(
      `/api/operator/missions/${missionId}/connect`,
      {
        method: 'POST',
        body,
        signal,
      },
    ),

  confirmHandover: (missionId: string, signal?: AbortSignal) =>
    apiRequest<ControlHandover>(
      `/api/operator/missions/${missionId}/handover`,
      {
        method: 'POST',
        signal,
      },
    ),

  savePreflight: (
    missionId: string,
    body: { items: PreflightItem[] },
    signal?: AbortSignal,
  ) =>
    apiRequest<PreflightRecord>(
      `/api/operator/missions/${missionId}/preflight`,
      {
        method: 'POST',
        body,
        signal,
      },
    ),
}
