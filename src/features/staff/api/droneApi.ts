import { env } from '../../../config/env'
import { getLanguage } from '../../../shared/i18n'
import { authenticatedFetch } from '../../auth/api/authApi'
import { droneApiMessages } from './droneApi.messages'

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

    const t = droneApiMessages[getLanguage()]
    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || t.loadFailed(response.status))
    }

    const payload: ApiResponse<DronePage> = await response.json()
    return payload.data.items.map((drone) => ({
      id: drone.id,
      label: `${drone.serialNumber} (${drone.droneModel?.modelCode ?? t.unknownModel})`,
    }))
  },
}
