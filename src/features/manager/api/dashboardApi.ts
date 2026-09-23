import { apiRequest } from '../../../shared/api/httpClient'
import type { ManagerDashboardResponse } from '../types/dashboard'

/** `GET /api/manager/dashboard` [TK MNG-01]. */
export const managerApi = {
  getDashboard(signal?: AbortSignal): Promise<ManagerDashboardResponse> {
    return apiRequest<ManagerDashboardResponse>('/api/manager/dashboard', {
      signal,
    })
  },
}
