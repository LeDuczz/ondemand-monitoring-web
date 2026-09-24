import { apiRequest } from '../../../shared/api/httpClient'
import type {
  PageResponseDroneModelResponse,
  PageResponseDronePayloadResponse,
  DroneModelResponse,
  DronePayloadResponse,
  DroneModelCreateRequest,
  DroneModelUpdateRequest,
  DronePayloadCreateRequest,
  DronePayloadUpdateRequest,
} from '../types/drones'
import type { MediaResponse } from '../types/missions'
import type {
  ServiceResponse,
  PreferredTimeResponse,
  CategoryServiceResponse,
  CategoryServiceRequest,
  DeliverableTypeResponse,
  DeliverableTypeRequest,
  ServiceRequest,
  PreferredTimeCreateRequest,
  PreferredTimeUpdateRequest,
  ServiceDeliverableResponse,
  ServiceDeliverableRequest,
} from '../types/reference'

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

  // ── Category Services CRUD ──
  /** `GET /api/category-services` [BE]. */
  listCategoryServices(signal?: AbortSignal): Promise<CategoryServiceResponse[]> {
    return apiRequest<CategoryServiceResponse[]>('/api/category-services', { signal })
  },
  /** `GET /api/category-services/{id}` [BE]. */
  getCategoryService(id: string, signal?: AbortSignal): Promise<CategoryServiceResponse> {
    return apiRequest<CategoryServiceResponse>(`/api/category-services/${id}`, { signal })
  },
  /** `POST /api/category-services` [BE]. */
  createCategoryService(data: CategoryServiceRequest): Promise<CategoryServiceResponse> {
    return apiRequest<CategoryServiceResponse>('/api/category-services', { method: 'POST', body: data })
  },
  /** `PUT /api/category-services/{id}` [BE]. */
  updateCategoryService(id: string, data: CategoryServiceRequest): Promise<CategoryServiceResponse> {
    return apiRequest<CategoryServiceResponse>(`/api/category-services/${id}`, { method: 'PUT', body: data })
  },
  /** `DELETE /api/category-services/{id}` [BE]. */
  deleteCategoryService(id: string): Promise<void> {
    return apiRequest<void>(`/api/category-services/${id}`, { method: 'DELETE' })
  },

  // ── Deliverable Types CRUD ──
  /** `GET /api/deliverable-types` [BE]. */
  listDeliverableTypes(signal?: AbortSignal): Promise<DeliverableTypeResponse[]> {
    return apiRequest<DeliverableTypeResponse[]>('/api/deliverable-types', { signal })
  },
  /** `GET /api/deliverable-types/{id}` [BE]. */
  getDeliverableType(id: string, signal?: AbortSignal): Promise<DeliverableTypeResponse> {
    return apiRequest<DeliverableTypeResponse>(`/api/deliverable-types/${id}`, { signal })
  },
  /** `POST /api/deliverable-types` [BE]. */
  createDeliverableType(data: DeliverableTypeRequest): Promise<DeliverableTypeResponse> {
    return apiRequest<DeliverableTypeResponse>('/api/deliverable-types', { method: 'POST', body: data })
  },
  /** `PUT /api/deliverable-types/{id}` [BE]. */
  updateDeliverableType(id: string, data: DeliverableTypeRequest): Promise<DeliverableTypeResponse> {
    return apiRequest<DeliverableTypeResponse>(`/api/deliverable-types/${id}`, { method: 'PUT', body: data })
  },
  /** `DELETE /api/deliverable-types/{id}` [BE]. */
  deleteDeliverableType(id: string): Promise<void> {
    return apiRequest<void>(`/api/deliverable-types/${id}`, { method: 'DELETE' })
  },

  // ── Services CRUD (remaining) ──
  /** `GET /api/services/{id}` [BE]. */
  getService(id: string, signal?: AbortSignal): Promise<ServiceResponse> {
    return apiRequest<ServiceResponse>(`/api/services/${id}`, { signal })
  },
  /** `POST /api/services` [BE]. */
  createService(data: ServiceRequest): Promise<ServiceResponse> {
    return apiRequest<ServiceResponse>('/api/services', { method: 'POST', body: data })
  },
  /** `PUT /api/services/{id}` [BE]. */
  updateService(id: string, data: ServiceRequest): Promise<ServiceResponse> {
    return apiRequest<ServiceResponse>(`/api/services/${id}`, { method: 'PUT', body: data })
  },
  /** `DELETE /api/services/{id}` [BE]. */
  deleteService(id: string): Promise<void> {
    return apiRequest<void>(`/api/services/${id}`, { method: 'DELETE' })
  },

  // ── Preferred Times CRUD (remaining) ──
  /** `GET /api/preferred-times/{id}` [BE]. */
  getPreferredTime(id: string, signal?: AbortSignal): Promise<PreferredTimeResponse> {
    return apiRequest<PreferredTimeResponse>(`/api/preferred-times/${id}`, { signal })
  },
  /** `GET /api/preferred-times/code/{code}` [BE]. */
  getPreferredTimeByCode(code: string, signal?: AbortSignal): Promise<PreferredTimeResponse> {
    return apiRequest<PreferredTimeResponse>(`/api/preferred-times/code/${code}`, { signal })
  },
  /** `POST /api/preferred-times` [BE]. */
  createPreferredTime(data: PreferredTimeCreateRequest): Promise<PreferredTimeResponse> {
    return apiRequest<PreferredTimeResponse>('/api/preferred-times', { method: 'POST', body: data })
  },
  /** `PUT /api/preferred-times/{id}` [BE]. */
  updatePreferredTime(id: string, data: PreferredTimeUpdateRequest): Promise<PreferredTimeResponse> {
    return apiRequest<PreferredTimeResponse>(`/api/preferred-times/${id}`, { method: 'PUT', body: data })
  },
  /** `DELETE /api/preferred-times/{id}` [BE]. */
  deletePreferredTime(id: string): Promise<void> {
    return apiRequest<void>(`/api/preferred-times/${id}`, { method: 'DELETE' })
  },

  // ── Service Deliverables ──
  /** `GET /api/service-deliverables` [BE]. */
  listServiceDeliverables(signal?: AbortSignal): Promise<ServiceDeliverableResponse[]> {
    return apiRequest<ServiceDeliverableResponse[]>('/api/service-deliverables', { signal })
  },
  /** `POST /api/service-deliverables` [BE]. */
  createServiceDeliverable(data: ServiceDeliverableRequest): Promise<ServiceDeliverableResponse> {
    return apiRequest<ServiceDeliverableResponse>('/api/service-deliverables', { method: 'POST', body: data })
  },
  /** `DELETE /api/service-deliverables/{id}` [BE]. */
  deleteServiceDeliverable(id: string): Promise<void> {
    return apiRequest<void>(`/api/service-deliverables/${id}`, { method: 'DELETE' })
  },

  // ── Drone Models CRUD (remaining) ──
  /** `GET /api/drone-models/{id}` [BE]. */
  getDroneModel(id: string, signal?: AbortSignal): Promise<DroneModelResponse> {
    return apiRequest<DroneModelResponse>(`/api/drone-models/${id}`, { signal })
  },
  /** `POST /api/drone-models` [BE]. */
  createDroneModel(data: DroneModelCreateRequest): Promise<DroneModelResponse> {
    return apiRequest<DroneModelResponse>('/api/drone-models', { method: 'POST', body: data })
  },
  /** `PUT /api/drone-models/{id}` [BE]. */
  updateDroneModel(id: string, data: DroneModelUpdateRequest): Promise<DroneModelResponse> {
    return apiRequest<DroneModelResponse>(`/api/drone-models/${id}`, { method: 'PUT', body: data })
  },
  /** `DELETE /api/drone-models/{id}` [BE]. */
  deleteDroneModel(id: string): Promise<void> {
    return apiRequest<void>(`/api/drone-models/${id}`, { method: 'DELETE' })
  },

  // ── Drone Payloads CRUD (remaining) ──
  /** `GET /api/drone-payloads/{id}` [BE]. */
  getDronePayload(id: string, signal?: AbortSignal): Promise<DronePayloadResponse> {
    return apiRequest<DronePayloadResponse>(`/api/drone-payloads/${id}`, { signal })
  },
  /** `POST /api/drone-payloads` [BE]. */
  createDronePayload(data: DronePayloadCreateRequest): Promise<DronePayloadResponse> {
    return apiRequest<DronePayloadResponse>('/api/drone-payloads', { method: 'POST', body: data })
  },
  /** `PUT /api/drone-payloads/{id}` [BE]. */
  updateDronePayload(id: string, data: DronePayloadUpdateRequest): Promise<DronePayloadResponse> {
    return apiRequest<DronePayloadResponse>(`/api/drone-payloads/${id}`, { method: 'PUT', body: data })
  },
  /** `DELETE /api/drone-payloads/{id}` [BE]. */
  deleteDronePayload(id: string): Promise<void> {
    return apiRequest<void>(`/api/drone-payloads/${id}`, { method: 'DELETE' })
  },
}
