import { apiRequest } from '../../../shared/api/httpClient'
import type {
  CreateMissionRequest,
  Mission,
  ResourceSuggestions,
} from '../types/missions'

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

  /** `GET /api/missions/{id}` [BE `MissionController.getById`]. */
  getMission(id: string, signal?: AbortSignal): Promise<Mission> {
    return apiRequest<Mission>(`/api/missions/${id}`, { signal })
  },

  /**
   * `GET /api/missions/{id}/resource-suggestions` [BRIEF C4]. `scenario`
   * is a PROPOSED query flag the mock uses to reach the design's "không đủ
   * nguồn lực" state deterministically (see mock JSON `_note`); a real
   * backend would compute `feasible` from the mission's own data instead.
   */
  getResourceSuggestions(
    missionId: string,
    options?: { scenario?: 'insufficient'; signal?: AbortSignal },
  ): Promise<ResourceSuggestions> {
    return apiRequest<ResourceSuggestions>(
      `/api/missions/${missionId}/resource-suggestions`,
      {
        query: options?.scenario ? { scenario: options.scenario } : undefined,
        signal: options?.signal,
      },
    )
  },

  /** `POST /api/missions/{id}/assign-drone?droneId=` [BE]. */
  assignDrone(missionId: string, droneId: string): Promise<Mission> {
    return apiRequest<Mission>(`/api/missions/${missionId}/assign-drone`, {
      method: 'POST',
      query: { droneId },
    })
  },
}
