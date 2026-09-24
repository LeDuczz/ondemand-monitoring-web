import { apiRequest } from '../../../shared/api/httpClient'
import { env } from '../../../config/env'
import type {
  CancelMissionRequest,
  CreateIncidentRequest,
  CreateMissionRequest,
  LiveTelemetry,
  MediaAssetResponse,
  MediaResponse,
  Mission,
  MissionCalendarItem,
  MissionIncident,
  MissionPlanResponse,
  MissionResponse,
  PatchScheduleRequest,
  PersistedPreflightCheckResponse,
  PostFlightStatusRequest,
  PreflightCheckResponse,
  ResourceSuggestions,
  WeatherPreflightCheckRequest,
  WeatherPreflightCheckResponse,
} from '../types/missions'

type StaffMissionPage = { items: MissionResponse[]; page: number; totalPages: number }

export function toMissionCalendarItem(source: MissionResponse): MissionCalendarItem {
  return {
    id: source.id,
    orderId: source.orderId,
    orderCode: null,
    missionCode: source.missionCode,
    status: source.status,
    attemptNumber: null,
    droneId: source.droneId,
    operatorId: source.operatorId,
    droneAssignmentId: null,
    operatorAssignmentId: null,
    scheduledStartAt: source.scheduledStartAt,
    scheduledEndAt: null,
    addressText: source.address,
    centerLat: source.latitude,
    centerLon: source.longitude,
    radiusM: null,
    requiredSensor: null,
    nearestBase: null,
    mediaRequirements: [],
    flightPlan: null,
    waypoints: [],
    serviceLabel: source.orderTitle || null,
    droneCode: source.droneCode,
    droneName: null,
    operatorName: null,
  }
}

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

  /** `POST /api/missions/{id}/assign-operator?operatorId=` [BE]. */
  assignOperator(missionId: string, operatorId: string): Promise<Mission> {
    return apiRequest<Mission>(`/api/missions/${missionId}/assign-operator`, {
      method: 'POST',
      query: { operatorId },
    })
  },

  /** `POST /api/missions/{id}/assignments/{aid}/release` [BRIEF C4 = TK]. */
  releaseAssignment(
    missionId: string,
    assignmentId: string,
    releaseReason: string,
  ): Promise<Mission> {
    return apiRequest<Mission>(
      `/api/missions/${missionId}/assignments/${assignmentId}/release`,
      { method: 'POST', body: { releaseReason } },
    )
  },

  /**
   * `GET /api/missions?from=&to=&status=` [TK]. Lists missions within an
   * optional date range and optional status filter for MNG-06 calendar view.
   */
  async listMissions(
    options: {
      from?: string
      to?: string
      status?: string
      signal?: AbortSignal
    } = {},
  ): Promise<{ items: MissionCalendarItem[] }> {
    const query: Record<string, string> = {}
    if (options.from) query['from'] = options.from
    if (options.to) query['to'] = options.to
    if (options.status) query['status'] = options.status
    if (env.useMockApi || import.meta.env.MODE === 'test') {
      return apiRequest<{ items: MissionCalendarItem[] }>('/api/missions', { query, signal: options.signal })
    }
    const items: MissionCalendarItem[] = []
    let page = 0
    let totalPages: number
    do {
      const result = await apiRequest<StaffMissionPage>('/api/missions/staff', {
        query: { ...query, page: String(page), size: '100' }, signal: options.signal,
      })
      items.push(...result.items.map(toMissionCalendarItem))
      totalPages = result.totalPages
      page += 1
    } while (page < totalPages)
    return { items }
  },

  /**
   * `PATCH /api/missions/{id}/schedule` [ĐỀ XUẤT]. Updates the scheduled
   * window of a mission; responds 409 SCHEDULE_CONFLICT when the drone
   * already has a booking in that slot.
   */
  patchSchedule(
    missionId: string,
    request: PatchScheduleRequest,
  ): Promise<Mission> {
    return apiRequest<Mission>(`/api/missions/${missionId}/schedule`, {
      method: 'PATCH',
      body: request,
    })
  },

  /**
   * `GET /api/missions/{id}/live` [BRIEF C4]. Polling endpoint for real-time
   * telemetry, incidents and livestream state.
   */
  getLive(missionId: string, signal?: AbortSignal): Promise<LiveTelemetry> {
    return apiRequest<LiveTelemetry>(`/api/missions/${missionId}/live`, {
      signal,
    })
  },

  /**
   * `POST /api/missions/{id}/incidents` [ĐỀ XUẤT — table `mission_incident`
   * exists in BRIEF A6].
   */
  createIncident(
    missionId: string,
    request: CreateIncidentRequest,
  ): Promise<MissionIncident> {
    return apiRequest<MissionIncident>(`/api/missions/${missionId}/incidents`, {
      method: 'POST',
      body: request,
    })
  },

  /**
   * `POST /api/missions/{id}/retry` [ĐỀ XUẤT]. Creates a new mission from a
   * FAILED mission. Returns the new mission id.
   */
  retryMission(missionId: string): Promise<{ newMissionId: string }> {
    return apiRequest<{ newMissionId: string }>(
      `/api/missions/${missionId}/retry`,
      { method: 'POST' },
    )
  },

  /**
   * `POST /api/missions/{id}/cancel` [ĐỀ XUẤT — field `cancellation_reason`
   * in BRIEF A6]. The UI must confirm with a 2-step modal (MNG-07 design).
   */
  cancelMission(
    missionId: string,
    request: CancelMissionRequest,
  ): Promise<Mission> {
    return apiRequest<Mission>(`/api/missions/${missionId}/cancel`, {
      method: 'POST',
      body: request,
    })
  },

  /** `GET /api/missions` [BE]. Lists missions, optionally filtered by operatorId. */
  listAllMissions(options?: {
    operatorId?: string
    signal?: AbortSignal
  }): Promise<MissionResponse[]> {
    const query: Record<string, string> = {}
    if (options?.operatorId) query['operatorId'] = options.operatorId
    return apiRequest<MissionResponse[]>('/api/missions', {
      query,
      signal: options?.signal,
    })
  },

  /** `GET /api/missions/pending-assignment` [BE]. */
  getPendingAssignment(signal?: AbortSignal): Promise<MissionResponse[]> {
    return apiRequest<MissionResponse[]>('/api/missions/pending-assignment', { signal })
  },

  /** `GET /api/missions/code/{missionCode}` [BE]. */
  getMissionByCode(missionCode: string, signal?: AbortSignal): Promise<MissionResponse> {
    return apiRequest<MissionResponse>(`/api/missions/code/${missionCode}`, { signal })
  },

  /** `GET /api/missions/{id}/plan` [BE]. */
  getMissionPlan(missionId: string, signal?: AbortSignal): Promise<MissionPlanResponse> {
    return apiRequest<MissionPlanResponse>(`/api/missions/${missionId}/plan`, { signal })
  },

  /** `POST /api/missions/{id}/start?tokenValue=` [BE]. */
  startMission(missionId: string, tokenValue: string): Promise<MissionResponse> {
    return apiRequest<MissionResponse>(`/api/missions/${missionId}/start`, {
      method: 'POST',
      query: { tokenValue },
    })
  },

  /** `POST /api/missions/{id}/complete` [BE]. */
  completeMission(missionId: string): Promise<MissionResponse> {
    return apiRequest<MissionResponse>(`/api/missions/${missionId}/complete`, {
      method: 'POST',
    })
  },

  /** `POST /api/missions/{id}/fail` [BE]. */
  failMission(missionId: string): Promise<MissionResponse> {
    return apiRequest<MissionResponse>(`/api/missions/${missionId}/fail`, {
      method: 'POST',
    })
  },

  /** `PATCH /api/missions/{id}/accept` [BE]. Header: X-Operator-Id. */
  acceptMission(missionId: string, operatorId: string): Promise<MissionResponse> {
    return apiRequest<MissionResponse>(`/api/missions/${missionId}/accept`, {
      method: 'PATCH',
      headers: { 'X-Operator-Id': operatorId },
    })
  },

  /** `PATCH /api/missions/{id}/reject` [BE]. */
  rejectMission(missionId: string): Promise<MissionResponse> {
    return apiRequest<MissionResponse>(`/api/missions/${missionId}/reject`, {
      method: 'PATCH',
    })
  },

  /** `POST /api/missions/{id}/preflight-check?droneCode=` [BE]. */
  preflightCheck(missionId: string, droneCode: string): Promise<PreflightCheckResponse> {
    return apiRequest<PreflightCheckResponse>(`/api/missions/${missionId}/preflight-check`, {
      method: 'POST',
      query: { droneCode },
    })
  },

  /** `GET /api/missions/{missionId}/media` [BE]. */
  getMissionMedia(missionId: string, signal?: AbortSignal): Promise<MediaResponse[]> {
    return apiRequest<MediaResponse[]>(`/api/missions/${missionId}/media`, { signal })
  },

  /**
   * `POST /api/missions/{id}/media` [BE]. Upload media (multipart).
   * TODO: `apiRequest` always sets `Content-Type: application/json` and
   * JSON-stringifies the body, so a `FormData` body will NOT be sent as
   * multipart through it as-is. This needs either a dedicated multipart
   * transport path in `httpClient.ts` (skip JSON stringify + let the
   * browser set the multipart boundary) or a separate upload helper
   * before this method is wired up to a real upload flow.
   */
  uploadMissionMedia(missionId: string, file: File): Promise<MediaAssetResponse> {
    const formData = new FormData()
    formData.append('file', file)
    return apiRequest<MediaAssetResponse>(`/api/missions/${missionId}/media`, {
      method: 'POST',
      body: formData,
    })
  },

  /** `GET /api/missions/{missionId}/preflight-checks` [BE]. History. */
  getPreflightHistory(missionId: string, signal?: AbortSignal): Promise<PersistedPreflightCheckResponse[]> {
    return apiRequest<PersistedPreflightCheckResponse[]>(`/api/missions/${missionId}/preflight-checks`, { signal })
  },

  /** `POST /api/missions/{missionId}/preflight-checks` [BE]. Start a new preflight check session. */
  startPreflightCheck(missionId: string): Promise<PersistedPreflightCheckResponse> {
    return apiRequest<PersistedPreflightCheckResponse>(`/api/missions/${missionId}/preflight-checks`, {
      method: 'POST',
    })
  },

  /** `GET /api/missions/{missionId}/preflight-checks/current` [BE]. */
  getCurrentPreflight(missionId: string, signal?: AbortSignal): Promise<PersistedPreflightCheckResponse> {
    return apiRequest<PersistedPreflightCheckResponse>(`/api/missions/${missionId}/preflight-checks/current`, { signal })
  },

  /** `POST /api/missions/{id}/connect` [BE]. */
  connectMission(missionId: string): Promise<MissionResponse> {
    return apiRequest<MissionResponse>(`/api/missions/${missionId}/connect`, {
      method: 'POST',
    })
  },

  /** `POST /api/missions/{id}/disconnect` [BE]. */
  disconnectMission(missionId: string): Promise<MissionResponse> {
    return apiRequest<MissionResponse>(`/api/missions/${missionId}/disconnect`, {
      method: 'POST',
    })
  },

  /** `POST /api/missions/{id}/return` [BE]. */
  returnMission(missionId: string): Promise<MissionResponse> {
    return apiRequest<MissionResponse>(`/api/missions/${missionId}/return`, {
      method: 'POST',
    })
  },

  /** `POST /api/missions/{id}/postflight` [BE]. */
  postflightMission(missionId: string): Promise<MissionResponse> {
    return apiRequest<MissionResponse>(`/api/missions/${missionId}/postflight`, {
      method: 'POST',
    })
  },

  /** `POST /api/missions/{id}/gcs-lost` [BE]. Report GCS connection lost. */
  reportGcsLost(missionId: string): Promise<MissionResponse> {
    return apiRequest<MissionResponse>(`/api/missions/${missionId}/gcs-lost`, {
      method: 'POST',
    })
  },

  /** `POST /api/missions/{id}/handover` [BE]. Handover mission. */
  handoverMission(missionId: string): Promise<MissionResponse> {
    return apiRequest<MissionResponse>(`/api/missions/${missionId}/handover`, {
      method: 'POST',
    })
  },

  /** `PATCH /api/missions/{id}/replace-drone` [BE]. Replace drone on mission. */
  replaceDrone(missionId: string): Promise<MissionResponse> {
    return apiRequest<MissionResponse>(`/api/missions/${missionId}/replace-drone`, {
      method: 'PATCH',
    })
  },

  /** `PATCH /api/missions/{id}/postflight-status` [BE]. Update post-flight status. */
  updatePostflightStatus(missionId: string, request: PostFlightStatusRequest): Promise<MissionResponse> {
    return apiRequest<MissionResponse>(`/api/missions/${missionId}/postflight-status`, {
      method: 'PATCH',
      body: request,
    })
  },

  /** `POST /api/missions/{missionId}/images` [BE]. Upload image for mission. */
  uploadMissionImage(missionId: string, file: File): Promise<MediaAssetResponse> {
    // TODO: needs multipart handling - apiRequest JSON-stringifies body
    return apiRequest<MediaAssetResponse>(`/api/missions/${missionId}/images`, {
      method: 'POST',
      body: file,
    })
  },

  /** `POST /api/weather/preflight-check` [BE]. Check weather conditions. */
  checkWeather(request: WeatherPreflightCheckRequest): Promise<WeatherPreflightCheckResponse> {
    return apiRequest<WeatherPreflightCheckResponse>('/api/weather/preflight-check', {
      method: 'POST',
      body: request,
    })
  },

  /** `GET /api/preflight-checks/{id}` [BE]. Get preflight check by ID. */
  getPreflightCheckById(id: string, signal?: AbortSignal): Promise<PersistedPreflightCheckResponse> {
    return apiRequest<PersistedPreflightCheckResponse>(`/api/preflight-checks/${id}`, { signal })
  },

  /** `PATCH /api/preflight-checks/{id}/items/{checkType}` [BE]. Update preflight check item. */
  updatePreflightCheckItem(id: string, checkType: string, data: unknown): Promise<PersistedPreflightCheckResponse> {
    return apiRequest<PersistedPreflightCheckResponse>(`/api/preflight-checks/${id}/items/${checkType}`, {
      method: 'PATCH',
      body: data,
    })
  },
}
