import { apiRequest } from '../../../shared/api/httpClient'
import type { CreateMissionRequest, Mission } from '../types/missions'

/** MNG-04 / MNG-05 mission-creation + dispatch APIs. See evd/00-PLAN.md §3-5. */
export const missionsApi = {
  /**
   * `POST /api/orders/{id}/missions` [BRIEF C4 = TK]. Attaches a flight
   * plan + schedule to the order's mission (created by `POST
   * /orders/{id}/approve` [BE]). See `evd/P5-manager-mission-dispatch.md`
   * for the conflict-resolution note on how this coexists with the
   * backend already creating a mission on approve.
   */
  createMission(
    orderId: string,
    request: CreateMissionRequest,
  ): Promise<Mission> {
    return apiRequest<Mission>(`/api/orders/${orderId}/missions`, {
      method: 'POST',
      body: request,
    })
  },
}
