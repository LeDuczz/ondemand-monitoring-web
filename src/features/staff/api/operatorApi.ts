import { env } from '../../../config/env'
import { getLanguage } from '../../../shared/i18n'
import { authenticatedFetch } from '../../auth/api/authApi'
import { operatorApiMessages } from './operatorApi.messages'

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
  async getAvailable(missionId?: string): Promise<AvailableOperator[]> {
    const url = new URL(`${env.apiBaseUrl}/api/operators/available`)
    if (missionId) url.searchParams.set('missionId', missionId)
    const response = await authenticatedFetch(url.toString())
    const payload = (await response.json().catch(() => ({}))) as Partial<
      ApiResponse<AvailableOperator[]>
    >
    if (!response.ok) {
      throw new Error(
        payload.message ||
          operatorApiMessages[getLanguage()].loadFailed(response.status),
      )
    }
    return payload.data ?? []
  },
}
