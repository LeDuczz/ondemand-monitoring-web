import { env } from '../../../config/env'
import { authenticatedFetch } from '../../auth/api/authApi'

interface DroneResponse {
  id: string
  serialNumber: string
  droneModel: { modelCode: string } | null
}

interface DronePage {
  items: DroneResponse[]
}

interface ApiResponse<T> {
  data: T
  message?: string
}

export interface AvailableDrone {
  id: string
  label: string
}

export const droneApi = {
  async getAvailable(): Promise<AvailableDrone[]> {
    const response = await authenticatedFetch(
      `${env.apiBaseUrl}/api/drones?status=AVAILABLE&size=100`,
    )

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || `Failed to load available drones (HTTP ${response.status})`)
    }

    const payload: ApiResponse<DronePage> = await response.json()
    return payload.data.items.map((drone) => ({
      id: drone.id,
      label: `${drone.serialNumber} (${drone.droneModel?.modelCode ?? 'Unknown model'})`,
    }))
  },
}
