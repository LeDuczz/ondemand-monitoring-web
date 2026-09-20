import { apiRequest } from '../../../shared/api/httpClient'
import type {
  OperatorProfile,
  OperatorMission,
  AvailabilitySlot,
  MissionOverlay,
  MediaFile,
  GCSDevice,
  FlightConnection,
} from '../omss/types'

export type MissionTab = 'pending' | 'upcoming' | 'history'

export type MissionListResponse = {
  items: OperatorMission[]
  total: number
}

export type AvailabilityResponse = {
  week: string
  slots: AvailabilitySlot[]
  missionOverlays: MissionOverlay[]
}

export type SaveAvailabilityBody = {
  week: string
  slots: AvailabilitySlot[]
}

export type ConnectGCSBody = {
  token: string
  gcsId: string
}

export type ConnectGCSResponse = {
  connection: FlightConnection
  gcsDevices: GCSDevice[]
}

export type PreflightItem = {
  id: string
  status: 'PASS' | 'FAIL'
}

export type PostflightBody = {
  items: PreflightItem[]
  faultType?: string
  notes?: string
}

export type MaintenanceTicketBody = {
  issueType: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  description: string
}

export type MaintenanceTicketResponse = {
  ticketId: string
  createdAt: string
}

export type MediaResponse = {
  files: MediaFile[]
}

export const operatorApi = {
  getProfile: (signal?: AbortSignal) =>
    apiRequest<OperatorProfile>('/api/operator/profile', { signal }),

  listMissions: (tab: MissionTab, signal?: AbortSignal) =>
    apiRequest<MissionListResponse>(`/api/operator/missions?tab=${tab}`, {
      signal,
    }),

  getMission: (id: string, signal?: AbortSignal) =>
    apiRequest<OperatorMission>(`/api/operator/missions/${id}`, { signal }),

  acceptMission: (id: string, signal?: AbortSignal) =>
    apiRequest<OperatorMission>(`/api/operator/missions/${id}/accept`, {
      method: 'POST',
      signal,
    }),

  rejectMission: (
    id: string,
    body: { reason: string; notes?: string },
    signal?: AbortSignal,
  ) =>
    apiRequest<OperatorMission>(`/api/operator/missions/${id}/reject`, {
      method: 'POST',
      body,
      signal,
    }),

  getAvailability: (week: string, signal?: AbortSignal) =>
    apiRequest<AvailabilityResponse>(
      `/api/operator/availability?week=${week}`,
      { signal },
    ),

  saveAvailability: (body: SaveAvailabilityBody, signal?: AbortSignal) =>
    apiRequest<AvailabilityResponse>('/api/operator/availability', {
      method: 'PUT',
      body,
      signal,
    }),

  connectGCS: (
    missionId: string,
    body: ConnectGCSBody,
    signal?: AbortSignal,
  ) =>
    apiRequest<ConnectGCSResponse>(
      `/api/operator/missions/${missionId}/connect`,
      { method: 'POST', body, signal },
    ),

  confirmHandover: (missionId: string, signal?: AbortSignal) =>
    apiRequest<{ confirmedAt: string }>(
      `/api/operator/missions/${missionId}/handover`,
      { method: 'POST', signal },
    ),

  savePreflight: (
    missionId: string,
    items: PreflightItem[],
    signal?: AbortSignal,
  ) =>
    apiRequest<{ result: 'PASS' | 'FAIL' }>(
      `/api/operator/missions/${missionId}/preflight`,
      { method: 'POST', body: { items }, signal },
    ),

  savePostflight: (
    missionId: string,
    body: PostflightBody,
    signal?: AbortSignal,
  ) =>
    apiRequest<OperatorMission>(
      `/api/operator/missions/${missionId}/postflight`,
      { method: 'POST', body, signal },
    ),

  createMaintenanceTicket: (
    missionId: string,
    body: MaintenanceTicketBody,
    signal?: AbortSignal,
  ) =>
    apiRequest<MaintenanceTicketResponse>(
      `/api/operator/missions/${missionId}/maintenance-ticket`,
      { method: 'POST', body, signal },
    ),

  getMedia: (missionId: string, signal?: AbortSignal) =>
    apiRequest<MediaResponse>(`/api/operator/missions/${missionId}/media`, {
      signal,
    }),

  retryMediaFile: (
    missionId: string,
    fileId: string,
    signal?: AbortSignal,
  ) =>
    apiRequest<MediaFile>(
      `/api/operator/missions/${missionId}/media/${fileId}/retry`,
      { method: 'POST', signal },
    ),
}
