import { apiRequest } from '../../../shared/api/httpClient'
import type {
  PageResponseDroneModelResponse,
  PageResponseDronePayloadResponse,
} from '../types/drones'
import type { MediaResponse } from '../types/missions'
import type { ServiceResponse, PreferredTimeResponse } from '../types/reference'

export const referenceApi = {
  /** `GET /api/drone-models` [BE]. */
  listDroneModels(signal?: AbortSignal): Promise<PageResponseDroneModelResponse> {
    return apiRequest<PageResponseDroneModelResponse>('/api/drone-models', { signal })
  },

  /** `GET /api/drone-payloads` [BE]. */
  listDronePayloads(signal?: AbortSignal): Promise<PageResponseDronePayloadResponse> {
    return apiRequest<PageResponseDronePayloadResponse>('/api/drone-payloads', { signal })
  },

  /** `GET /api/services` [BE]. */
  listServices(signal?: AbortSignal): Promise<ServiceResponse[]> {
    return apiRequest<ServiceResponse[]>('/api/services', { signal })
  },

  /** `GET /api/preferred-times` [BE]. */
  listPreferredTimes(signal?: AbortSignal): Promise<PreferredTimeResponse[]> {
    return apiRequest<PreferredTimeResponse[]>('/api/preferred-times', { signal })
  },

  /** `GET /api/media/{mediaId}` [BE]. Get media by ID. */
  getMedia(mediaId: string, signal?: AbortSignal): Promise<MediaResponse> {
    return apiRequest<MediaResponse>(`/api/media/${mediaId}`, { signal })
  },

  /** `GET /api/media/{mediaId}/file` [BE]. Get media file. */
  getMediaFile(mediaId: string, signal?: AbortSignal): Promise<MediaResponse> {
    return apiRequest<MediaResponse>(`/api/media/${mediaId}/file`, { signal })
  },
}
