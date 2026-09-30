import { apiRequest } from '../../../shared/api/httpClient'
import type { MissionStatus } from '../../../shared/types/domain'

export interface CustomerMissionHistory {
  id: string
  missionCode: string
  orderId: string
  orderTitle: string
  address: string | null
  /** Swagger lists the full mission enum; the BE only returns finished ones. */
  status: MissionStatus
  scheduledStartAt: string | null
  startedAt: string | null
  completedAt: string | null
  description: string | null
}
export interface CustomerMissionHistoryPage {
  items: CustomerMissionHistory[]
  page: number
  size?: number
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
  /** Every page of the history (size 20), for lookups by order or mission. */
  listAll: async (signal?: AbortSignal, maxPages = 10) => {
    const all: CustomerMissionHistory[] = []
    for (let page = 0; page < maxPages; page += 1) {
      const result = await customerMissionHistoryApi.list(page, signal)
      all.push(...result.items)
      if (result.last || result.totalPages === 0) break
    }
    return all
  },
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
