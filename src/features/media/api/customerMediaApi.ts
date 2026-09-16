import { env } from '../../../config/env'
import { authSession, AuthApiError } from '../../auth/api/authApi'
import type { ApiResponse } from '../../auth/types'

export type AvailableMedia = {
  id: string
  deviceCode?: string
  missionId: string
  type: 'IMAGE' | 'VIDEO'
  originalFileName?: string
  contentType: string
  fileSize?: number
  capturedAt: string
  createdAt?: string
}

export type MediaMetadata = {
  id: string
  missionId: string
  droneId?: string
  type: 'IMAGE' | 'VIDEO'
  url: string
  expiresIn?: number
  contentType: string
  fileSize?: number
  capturedAt: string
}

async function request<T>(path: string) {
  const token = authSession.getAccessToken()
  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    credentials: 'include',
  })
  const payload = (await response.json().catch(() => undefined)) as
    ApiResponse<T> | undefined
  if (!response.ok || payload?.success === false) {
    throw new AuthApiError(
      payload?.message ?? 'Unable to load media. Please try again.',
      payload?.code,
    )
  }
  return payload?.data as T
}

export const customerMediaApi = {
  list: (missionId: string) =>
    request<AvailableMedia[]>(
      `/api/missions/${encodeURIComponent(missionId)}/media`,
    ),
  getMetadata: (mediaId: string) =>
    request<MediaMetadata>(`/api/media/${encodeURIComponent(mediaId)}`),
}
