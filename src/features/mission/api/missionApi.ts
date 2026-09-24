import type {
  Mission,
  PreflightCheck,
  DeviceImage,
  DeviceStatus,
} from '../types/mission'
import type { FlightControlStatus } from '../../drone-operator/omss/api/flightControlApi'

import { env } from '../../../config/env'

const API_BASE = `${env.apiBaseUrl}/api`

interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

import { authenticatedFetch } from '../../auth/api/authApi'

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const headers = new Headers(options?.headers)
  headers.set('Content-Type', 'application/json')

  const res = await authenticatedFetch(url, {
    ...options,
    headers,
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(
      errorData.message || `HTTP ${res.status}: ${res.statusText}`,
    )
  }

  const payload: ApiResponse<T> = await res.json()
  return payload.data
}

export const missionApi = {
  // GET /api/missions?operatorId={id} – list all missions for an operator
  getMissionsByOperator: async (operatorId: string): Promise<Mission[]> => {
    return request<Mission[]>(
      `${API_BASE}/missions?operatorId=${encodeURIComponent(operatorId)}`,
    )
  },

  // Query Mission Details
  getMissionById: async (missionId: string): Promise<Mission> => {
    return request<Mission>(`${API_BASE}/missions/${missionId}`)
  },

  getPendingAssignmentMissions: async (): Promise<Mission[]> => {
    return request<Mission[]>(`${API_BASE}/missions/pending-assignment`)
  },

  getMyMissions: async (): Promise<Mission[]> => {
    return request<Mission[]>(`${API_BASE}/missions/mine`)
  },

  assignResources: async (
    missionId: string,
    droneId: string,
    operatorId: string,
  ): Promise<Mission> => {
    return request<Mission>(
      `${API_BASE}/missions/${encodeURIComponent(missionId)}/assign-resources`,
      {
        method: 'POST',
        body: JSON.stringify({ droneId, operatorId }),
      },
    )
  },

  acceptMyMission: async (missionId: string): Promise<Mission> => {
    return request<Mission>(
      `${API_BASE}/missions/${encodeURIComponent(missionId)}/accept-current`,
      { method: 'PATCH' },
    )
  },

  rejectMyMission: async (missionId: string, reason: string): Promise<Mission> => {
    return request<Mission>(
      `${API_BASE}/missions/${encodeURIComponent(missionId)}/reject-current`,
      { method: 'PATCH', body: JSON.stringify({ reason }) },
    )
  },

  handoverMyMission: async (missionId: string): Promise<Mission> => {
    return request<Mission>(
      `${API_BASE}/missions/${encodeURIComponent(missionId)}/handover-current`,
      { method: 'POST' },
    )
  },

  assignDrone: async (missionId: string, droneId: string): Promise<Mission> => {
    return request<Mission>(
      `${API_BASE}/missions/${missionId}/assign-drone?droneId=${encodeURIComponent(droneId)}`,
      { method: 'POST' },
    )
  },

  assignOperator: async (missionId: string, operatorId: string): Promise<Mission> => {
    return request<Mission>(
      `${API_BASE}/missions/${missionId}/assign-operator?operatorId=${encodeURIComponent(operatorId)}`,
      { method: 'POST' },
    )
  },

  // F3.1 Accept mission (PATCH /api/missions/{id}/accept)
  acceptMission: async (
    missionId: string,
    _operatorId?: string,
  ): Promise<Mission> => {
    return request<Mission>(`${API_BASE}/missions/${missionId}/accept-current`, {
      method: 'PATCH',
    })
  },

  // F3.1 Reject mission (PATCH /api/missions/{id}/reject)
  rejectMission: async (
    missionId: string,
    reason: string,
    _operatorId?: string,
  ): Promise<Mission> => {
    return request<Mission>(`${API_BASE}/missions/${missionId}/reject-current`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    })
  },

  // F3.2 Connect GCS (POST /api/missions/{id}/connect)
  connectGcs: async (missionId: string): Promise<Mission> => {
    return request<Mission>(`${API_BASE}/missions/${missionId}/connect`, {
      method: 'POST',
    })
  },

  getTelemetryReadiness: async (missionId: string): Promise<{
    droneCode: string
    ready: boolean
    lastTelemetryAt: string | null
  }> => {
    return request(`${API_BASE}/missions/${encodeURIComponent(missionId)}/telemetry-readiness`)
  },

  // F3.2 Run Pre-flight check (POST /api/missions/{id}/preflight-check?deviceCode=DRONE-01)
  runPreflightCheck: async (
    missionId: string,
    deviceCode: string,
  ): Promise<PreflightCheck> => {
    return request<PreflightCheck>(
      `${API_BASE}/missions/${missionId}/preflight-check?droneCode=${encodeURIComponent(
        deviceCode,
      )}`,
      { method: 'POST' },
    )
  },

  // F3.2 Replace Drone (PATCH /api/missions/{id}/replace-drone)
  replaceDrone: async (
    missionId: string,
    newDeviceCode: string,
  ): Promise<Mission> => {
    return request<Mission>(`${API_BASE}/missions/${missionId}/replace-drone`, {
      method: 'PATCH',
      body: JSON.stringify({ newDeviceCode }),
    })
  },

  // F3.2 Handover Control (POST /api/missions/{id}/handover)
  handoverControl: async (
    missionId: string,
    _newOperatorId?: string,
  ): Promise<Mission> => {
    return request<Mission>(`${API_BASE}/missions/${missionId}/handover-current`, {
      method: 'POST',
    })
  },

  // F3.3 Start Mission / Takeoff (POST /api/missions/{id}/start)
  startMission: async (
    missionId: string,
    tokenValue?: string,
  ): Promise<Mission> => {
    const query = tokenValue
      ? `?tokenValue=${encodeURIComponent(tokenValue)}`
      : ''
    return request<Mission>(`${API_BASE}/missions/${missionId}/start${query}`, {
      method: 'POST',
    })
  },

  // F3.3 Upload Mission Image / Media (POST /api/missions/{id}/media)
  uploadMedia: async (
    missionId: string,
    deviceCode: string,
    file: File,
  ): Promise<DeviceImage> => {
    const formData = new FormData()
    formData.append('deviceCode', deviceCode)
    formData.append('file', file)

    const res = await authenticatedFetch(`${API_BASE}/missions/${missionId}/media`, {
      method: 'POST',
      body: formData,
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      throw new Error(errorData.message || `Upload failed: ${res.statusText}`)
    }

    const payload: ApiResponse<DeviceImage> = await res.json()
    return payload.data
  },

  // F3.3 Mark Returning (POST /api/missions/{id}/return)
  markReturning: async (missionId: string): Promise<Mission> => {
    return request<Mission>(`${API_BASE}/missions/${missionId}/return`, {
      method: 'POST',
    })
  },

  // F3.4 Start Postflight Checking (POST /api/missions/{id}/postflight)
  startPostflight: async (missionId: string): Promise<Mission> => {
    return request<Mission>(`${API_BASE}/missions/${missionId}/postflight`, {
      method: 'POST',
    })
  },

  // F3.5 Update Post-flight Status & Complete (PATCH /api/missions/{id}/postflight-status?deviceCode=...)
  postFlightStatus: async (
    missionId: string,
    deviceCode: string,
    newDroneStatus: DeviceStatus,
    notes: string,
    inspectionResults?: Record<string, 'PASS' | 'WARN' | 'FAIL'>,
    telemetrySnapshot?: FlightControlStatus | null,
  ): Promise<Mission> => {
    return request<Mission>(
      `${API_BASE}/missions/${missionId}/postflight-status?droneCode=${encodeURIComponent(
        deviceCode,
      )}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ newDroneStatus, notes, inspectionResults, telemetrySnapshot }),
      },
    )
  },

  // F3.5 Complete Mission (POST /api/missions/{id}/complete)
  completeMission: async (missionId: string): Promise<Mission> => {
    return request<Mission>(`${API_BASE}/missions/${missionId}/complete`, {
      method: 'POST',
    })
  },

  failMission: async (missionId: string, reason: string): Promise<Mission> => {
    return request<Mission>(`${API_BASE}/missions/${missionId}/fail`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    })
  },
}
