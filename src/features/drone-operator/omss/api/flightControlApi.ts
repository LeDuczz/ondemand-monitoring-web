import { authSession, authenticatedFetch } from '../../../auth/api/authApi'
import { env } from '../../../../config/env'

const baseUrl =
  import.meta.env.VITE_FLIGHT_CONTROL_API_URL ?? 'http://localhost:8090'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, options)
  const payload = await response.json().catch(() => undefined)
  if (!response.ok) {
    throw new Error(payload?.error ?? `Flight Controller HTTP ${response.status}`)
  }
  return payload as T
}

export type FlightControlStatus = {
  online: boolean
  missionId?: string
  deviceCode?: string
  inAir?: boolean
  positionReady?: boolean
  altitudeM?: number
  speedMps?: number
  batteryPercent?: number
  connection?: { grpcConnected?: boolean; px4Connected?: boolean }
}

export const flightControlApi = {
  baseUrl,
  status: () => request<FlightControlStatus>('/api/control/status'),
  bindSession: async (missionId: string, droneCode: string) => {
    const authorization = await authenticatedFetch(
      `${env.apiBaseUrl}/api/missions/${encodeURIComponent(missionId)}`,
    )
    if (!authorization.ok) {
      throw new Error(`Mission access check failed (HTTP ${authorization.status}); refresh the mission or sign in again`)
    }
    const accessToken = authSession.getAccessToken()
    if (!accessToken) {
      throw new Error('Authentication is required to bind the flight session')
    }
    return request<{ ok: boolean; missionId: string; droneCode: string }>(
      '/api/control/session',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ missionId, droneCode, accessToken }),
      },
    )
  },
}
