import { env } from '../../../config/env'
import { authenticatedFetch } from '../../auth/api/authApi'

export interface AvailableOperator {
  id: string
  fullName: string
  email: string
}

interface ApiResponse<T> {
  data: T
  message?: string
}

export const operatorApi = {
  async getAvailable(): Promise<AvailableOperator[]> {
    const response = await authenticatedFetch(
      `${env.apiBaseUrl}/api/operators/available`,
    )
    const payload = (await response.json().catch(() => ({}))) as Partial<
      ApiResponse<AvailableOperator[]>
    >
    if (!response.ok) {
      throw new Error(payload.message || `Failed to load operators (HTTP ${response.status})`)
    }
    return payload.data ?? []
  },
}
