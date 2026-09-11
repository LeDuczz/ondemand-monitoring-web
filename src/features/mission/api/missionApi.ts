import type {
  Mission,
  PreflightCheck,
  DeviceImage,
  DeviceStatus,
} from '../types/mission'

const API_BASE = 'http://localhost:8080/api'

interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      'X-Operator-Id': 'OP-001',
      ...options?.headers,
    },
    ...options,
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
  // Query Mission Details
  getMissionById: async (missionId: string): Promise<Mission> => {
    return request<Mission>(`${API_BASE}/missions/${missionId}`)
  },

  // F3.1 Accept mission (PATCH /api/missions/{id}/accept)
  acceptMission: async (
    missionId: string,
    operatorId = 'OP-001',
  ): Promise<Mission> => {
    return request<Mission>(`${API_BASE}/missions/${missionId}/accept`, {
      method: 'PATCH',
      headers: { 'X-Operator-Id': operatorId },
    })
  },

  // F3.1 Reject mission (PATCH /api/missions/{id}/reject)
  rejectMission: async (
    missionId: string,
    reason: string,
    operatorId = 'OP-001',
  ): Promise<Mission> => {
    return request<Mission>(`${API_BASE}/missions/${missionId}/reject`, {
      method: 'PATCH',
      headers: { 'X-Operator-Id': operatorId },
      body: JSON.stringify({ reason }),
    })
  },

  // F3.2 Connect GCS (POST /api/missions/{id}/connect)
  connectGcs: async (missionId: string): Promise<Mission> => {
    return request<Mission>(`${API_BASE}/missions/${missionId}/connect`, {
      method: 'POST',
    })
  },

  // F3.2 Run Pre-flight check (POST /api/missions/{id}/preflight-check?deviceCode=DRONE-01)
  runPreflightCheck: async (
    missionId: string,
    deviceCode: string,
  ): Promise<PreflightCheck> => {
    return request<PreflightCheck>(
      `${API_BASE}/missions/${missionId}/preflight-check?deviceCode=${encodeURIComponent(
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
    newOperatorId = 'OP-001',
  ): Promise<Mission> => {
    return request<Mission>(`${API_BASE}/missions/${missionId}/handover`, {
      method: 'POST',
      headers: { 'X-Operator-Id': newOperatorId },
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

    const res = await fetch(`${API_BASE}/missions/${missionId}/media`, {
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
    newDeviceStatus: DeviceStatus,
    notes: string,
  ): Promise<Mission> => {
    return request<Mission>(
      `${API_BASE}/missions/${missionId}/postflight-status?deviceCode=${encodeURIComponent(
        deviceCode,
      )}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ newDeviceStatus, notes }),
      },
    )
  },

  // F3.5 Complete Mission (POST /api/missions/{id}/complete)
  completeMission: async (missionId: string): Promise<Mission> => {
    return request<Mission>(`${API_BASE}/missions/${missionId}/complete`, {
      method: 'POST',
    })
  },
}
