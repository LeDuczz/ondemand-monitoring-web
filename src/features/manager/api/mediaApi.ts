import { apiRequest } from '../../../shared/api/httpClient'
import type {
  BadMediaItem,
  ManualUploadTask,
  MediaNeedsActionResponse,
} from '../types/media'

export const mediaApi = {
  /** `GET /api/media?needs_action=true` [TK MNG-11]. */
  listNeedsAction(signal?: AbortSignal): Promise<MediaNeedsActionResponse> {
    return apiRequest<MediaNeedsActionResponse>('/api/media', {
      query: { needs_action: 'true' },
      signal,
    })
  },

  /** `POST /api/manual-upload-tasks/{id}/reassign` [ĐỀ XUẤT]. */
  reassignTask(taskId: string, operatorId: string): Promise<ManualUploadTask> {
    return apiRequest<ManualUploadTask>(
      `/api/manual-upload-tasks/${taskId}/reassign`,
      { method: 'POST', body: { operatorId } },
    )
  },

  /** `POST /api/media/{id}/request-reupload` [ĐỀ XUẤT]. */
  requestReupload(mediaId: string, reason: string): Promise<BadMediaItem> {
    return apiRequest<BadMediaItem>(`/api/media/${mediaId}/request-reupload`, {
      method: 'POST',
      body: { reason },
    })
  },

  /** `POST /api/orders/{id}/deliver` [BRIEF C4]. */
  deliverOrder(
    orderId: string,
    deliveryNote?: string,
  ): Promise<{
    id: string
    code: string
    status: string
    deliveredAt: string
  }> {
    return apiRequest(`/api/orders/${orderId}/deliver`, {
      method: 'POST',
      body: { deliveryNote: deliveryNote ?? '' },
    })
  },
}
