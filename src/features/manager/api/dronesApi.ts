import { apiRequest } from '../../../shared/api/httpClient'
import type { DroneStatus } from '../../../shared/types/domain'
import type {
  DroneCreateRequest,
  DroneResponse,
  DroneTelemetryResponse,
  DroneUpdateRequest,
  PageResponseDroneResponse,
  TelemetryRequest,
} from '../types/drones'
import type { MediaAssetResponse, MediaResponse } from '../types/missions'

export const dronesApi = {
  /** `GET /api/drones?status=&modelId=&payloadId=&page=&pageSize=` [BE DroneController]. */
  listDrones(options?: {
    status?: DroneStatus
    modelId?: string
    payloadId?: string
    page?: number
    pageSize?: number
    signal?: AbortSignal
  }): Promise<PageResponseDroneResponse> {
    const query: Record<string, string> = {}
    if (options?.status) query['status'] = options.status
    if (options?.modelId) query['modelId'] = options.modelId
    if (options?.payloadId) query['payloadId'] = options.payloadId
    if (options?.page != null) query['page'] = String(options.page)
    if (options?.pageSize != null) query['pageSize'] = String(options.pageSize)
    return apiRequest<PageResponseDroneResponse>('/api/drones', {
      query,
      signal: options?.signal,
    })
  },

  /** `GET /api/drones/{id}` [BE]. */
  getDrone(id: string, signal?: AbortSignal): Promise<DroneResponse> {
    return apiRequest<DroneResponse>(`/api/drones/${id}`, { signal })
  },

  /** `POST /api/drones` [BE]. */
  createDrone(data: DroneCreateRequest): Promise<DroneResponse> {
    return apiRequest<DroneResponse>('/api/drones', {
      method: 'POST',
      body: data,
    })
  },

  /** `PUT /api/drones/{id}` [BE]. */
  updateDrone(id: string, data: DroneUpdateRequest): Promise<DroneResponse> {
    return apiRequest<DroneResponse>(`/api/drones/${id}`, {
      method: 'PUT',
      body: data,
    })
  },

  /** `DELETE /api/drones/{id}` [BE]. */
  deleteDrone(id: string): Promise<void> {
    return apiRequest<void>(`/api/drones/${id}`, { method: 'DELETE' })
  },

  /** `POST /api/drones/{droneCode}/telemetry` [BE]. Send telemetry data. */
  sendTelemetry(droneCode: string, data: TelemetryRequest): Promise<DroneTelemetryResponse> {
    return apiRequest<DroneTelemetryResponse>(`/api/drones/${droneCode}/telemetry`, {
      method: 'POST',
      body: data,
    })
  },

  /** `POST /api/drones/{droneCode}/preflight-checks` [BE]. Run standalone preflight check. */
  runStandalonePreflightCheck(droneCode: string): Promise<unknown> {
    return apiRequest<unknown>(`/api/drones/${droneCode}/preflight-checks`, {
      method: 'POST',
    })
  },

  /** `GET /api/drones/{droneCode}/media` [BE]. List drone media. */
  listDroneMedia(droneCode: string, signal?: AbortSignal): Promise<MediaAssetResponse[]> {
    return apiRequest<MediaAssetResponse[]>(`/api/drones/${droneCode}/media`, { signal })
  },

  /** `GET /api/drones/{droneCode}/media/{mediaId}` [BE]. Get drone media by ID. */
  getDroneMedia(droneCode: string, mediaId: string, signal?: AbortSignal): Promise<MediaAssetResponse> {
    return apiRequest<MediaAssetResponse>(`/api/drones/${droneCode}/media/${mediaId}`, { signal })
  },

  /** `DELETE /api/drones/{droneCode}/media/{mediaId}` [BE]. Delete drone media. */
  deleteDroneMedia(droneCode: string, mediaId: string): Promise<void> {
    return apiRequest<void>(`/api/drones/${droneCode}/media/${mediaId}`, { method: 'DELETE' })
  },

  /** `GET /api/drones/{droneCode}/media/{mediaId}/file` [BE]. Get drone media file URL. */
  getDroneMediaFile(droneCode: string, mediaId: string, signal?: AbortSignal): Promise<MediaResponse> {
    return apiRequest<MediaResponse>(`/api/drones/${droneCode}/media/${mediaId}/file`, { signal })
  },

  /** `POST /api/drones/{droneCode}/images` [BE]. Upload image for drone. */
  uploadDroneImage(droneCode: string, file: File): Promise<MediaAssetResponse> {
    // TODO: needs multipart handling - apiRequest JSON-stringifies body
    return apiRequest<MediaAssetResponse>(`/api/drones/${droneCode}/images`, {
      method: 'POST',
      body: file,
    })
  },
}
