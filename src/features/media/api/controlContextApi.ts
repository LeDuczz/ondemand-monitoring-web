import { env } from '../../../config/env'
import { authenticatedFetch, AuthApiError } from '../../auth/api/authApi'
import type { ApiResponse } from '../../auth/types'

export type MissionControlContext = {
  missionId: string
  missionCode: string
  droneId: string
  operatorId: string
  missionStatus: string
  controlAllowed: boolean
  mediaCaptureAllowed: boolean
  mediaUploadAllowed: boolean
}

export const controlContextApi = {
  async get(missionId: string): Promise<MissionControlContext> {
    const response = await authenticatedFetch(
      `${env.apiBaseUrl}/api/missions/${encodeURIComponent(missionId)}/control-context`,
    )
    const payload = (await response.json().catch(() => undefined)) as
      ApiResponse<MissionControlContext> | undefined
    if (!response.ok || !payload?.data) {
      throw new AuthApiError(
        payload?.message ?? 'Unable to open this mission for drone control.',
        payload?.code,
      )
    }
    return payload.data
  },
}
