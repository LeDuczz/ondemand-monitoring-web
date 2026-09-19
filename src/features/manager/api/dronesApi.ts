import { apiRequest } from '../../../shared/api/httpClient'
import type { DroneStatus } from '../../../shared/types/domain'
import type { DroneItem } from '../types/drones'

export const dronesApi = {
  /** `GET /api/drones?status=&page=&pageSize=` [BE DroneController]. */
  listDrones(options?: {
    status?: DroneStatus
    page?: number
    pageSize?: number
    signal?: AbortSignal
  }): Promise<{ items: DroneItem[]; total: number; page: number; pageSize: number }> {
    const query: Record<string, string> = {}
    if (options?.status) query['status'] = options.status
    if (options?.page != null) query['page'] = String(options.page)
    if (options?.pageSize != null) query['pageSize'] = String(options.pageSize)
    return apiRequest<{ items: DroneItem[]; total: number; page: number; pageSize: number }>(
      '/api/drones',
      { query, signal: options?.signal },
    )
  },

  /** `PATCH /api/drones/{id}/status` [ĐỀ XUẤT]. */
  patchDroneStatus(
    droneId: string,
    status: DroneStatus,
    reason: string,
  ): Promise<DroneItem> {
    return apiRequest<DroneItem>(`/api/drones/${droneId}/status`, {
      method: 'PATCH',
      body: { status, reason },
    })
  },
}
