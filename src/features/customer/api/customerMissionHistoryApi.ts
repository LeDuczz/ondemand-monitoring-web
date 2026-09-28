import { apiRequest } from '../../../shared/api/httpClient'
import type {
  UploadedMissionMedia,
  UploadedMissionMediaPage,
} from '../../media/types/missionMedia'

export interface CustomerMissionHistory {
  id: string
  missionCode: string
  orderId: string
  orderTitle: string
  address: string | null
  status: 'COMPLETED' | 'FAILED' | 'CANCELLED'
  scheduledStartAt: string | null
  startedAt: string | null
  completedAt: string | null
  description: string | null
}
export interface CustomerMissionHistoryPage {
  items: CustomerMissionHistory[]
  page: number
  totalItems: number
  totalPages: number
  first: boolean
  last: boolean
}
export interface CustomerMissionMediaStatus {
  availableCount: number
  processingCount: number
  rejectedCount: number
}

const missionPath = (id: string) =>
  `/api/customer/missions/${encodeURIComponent(id)}`
export const customerMissionHistoryApi = {
  list: (page: number, signal?: AbortSignal) =>
    apiRequest<CustomerMissionHistoryPage>('/api/customer/mission-history', {
      query: { page, size: 20 },
      signal,
    }),
  get: (id: string, signal?: AbortSignal) =>
    apiRequest<CustomerMissionHistory>(
      `/api/customer/mission-history/${encodeURIComponent(id)}`,
      { signal },
    ),
  mediaStatus: (id: string, signal?: AbortSignal) =>
    apiRequest<CustomerMissionMediaStatus>(`${missionPath(id)}/media-status`, {
      signal,
    }),
}
export const customerMissionMediaApi = {
  list: (id: string, page: number, signal?: AbortSignal) =>
    apiRequest<UploadedMissionMediaPage>(`${missionPath(id)}/media`, {
      query: { page, size: 12 },
      signal,
    }),
  get: (id: string, mediaId: string, signal?: AbortSignal) =>
    apiRequest<UploadedMissionMedia>(
      `${missionPath(id)}/media/${encodeURIComponent(mediaId)}`,
      { signal },
    ),
}
