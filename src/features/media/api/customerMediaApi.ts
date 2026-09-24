import { env } from '../../../config/env'
import { authenticatedFetch, AuthApiError } from '../../auth/api/authApi'
import type { ApiResponse } from '../../auth/types'

export type AvailableMedia = {
  mediaId: string
  missionId: string
  droneCode: string
  mediaType: 'IMAGE' | 'VIDEO'
  fileName: string
  contentType: string
  fileSize: number
  capturedAt: string
  availableAt: string
  downloadUrl: string
}

export type MediaNotification = {
  notificationId: string
  mediaId: string
  missionId: string
  eventType: string
  createdAt: string
}

async function request<T>(path: string): Promise<T> {
  const response = await authenticatedFetch(`${env.apiBaseUrl}/api${path}`)
  const payload = (await response.json().catch(() => undefined)) as ApiResponse<T> | undefined
  if (!response.ok || !payload?.success) {
    throw new AuthApiError(payload?.message ?? 'Unable to load media.', payload?.code)
  }
  return payload.data as T
}

export const customerMediaApi = {
  listMine: () => request<AvailableMedia[]>('/customer/available-media'),
  myNotifications: () => request<MediaNotification[]>('/customer/media-notifications'),
  list: (missionId: string) => request<AvailableMedia[]>(
    `/missions/${encodeURIComponent(missionId)}/available-media`,
  ),
  getMetadata: (mediaId: string) => request<AvailableMedia>(
    `/media/${encodeURIComponent(mediaId)}/download`,
  ),
  notifications: (missionId: string) => request<MediaNotification[]>(
    `/missions/${encodeURIComponent(missionId)}/media-notifications`,
  ),
}
