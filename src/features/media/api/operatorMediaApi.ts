import { env } from '../../../config/env'
import { authenticatedFetch } from '../../auth/api/authApi'

const controllerUrl = import.meta.env.VITE_FLIGHT_CONTROL_API_URL ?? 'http://localhost:8090'

export type LocalMedia = {
  localMediaId: string
  missionId: string
  missionCode?: string
  droneCode: string
  mediaType: 'IMAGE' | 'VIDEO'
  fileName: string
  contentType: string
  fileSize: number
  checksumSha256: string
  capturedAt: string
  status: 'REVIEW_PENDING' | 'UPLOADING' | 'UPLOAD_FAILED' | 'VALIDATING'
  previewError?: string
  backendMediaId?: string
}

type UploadPlan = {
  mediaId: string
  attemptId: string
  status: string
  uploadMethod: 'PUT' | 'MULTIPART' | null
  uploadUrl: string | null
  uploadHeaders: Record<string, string[]>
  partSizeBytes: number
  partCount: number
}

async function backend<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const response = await authenticatedFetch(`${env.apiBaseUrl}/api${path}`, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const payload = await response.json().catch(() => undefined)
  if (!response.ok || !payload?.success) {
    throw new Error(payload?.message ?? `Backend HTTP ${response.status}`)
  }
  return payload.data as T
}

async function controller<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const response = await fetch(`${controllerUrl}${path}`, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const payload = await response.json().catch(() => undefined)
  if (!response.ok) throw new Error(payload?.error ?? `Flight Controller HTTP ${response.status}`)
  return payload as T
}

export const operatorMediaApi = {
  controllerUrl,
  previewUrl(id: string) {
    return `${controllerUrl}/api/media/local/${encodeURIComponent(id)}/preview`
  },
  async list(missionId: string): Promise<LocalMedia[]> {
    const response = await controller<{ media: LocalMedia[] }>('/api/media/local')
    return response.media.filter((item) => item.missionId === missionId)
  },
  discard(id: string) {
    return controller(`/api/media/local/${encodeURIComponent(id)}/discard`, 'POST')
  },
  async upload(item: LocalMedia): Promise<string> {
    const missionId = encodeURIComponent(item.missionId)
    const preparePath = `/missions/${missionId}/media-uploads`
    let plan = await backend<UploadPlan>(preparePath, 'POST', {
      droneCode: item.droneCode,
      localMediaId: item.localMediaId,
      mediaType: item.mediaType,
      fileName: item.fileName,
      contentType: item.contentType,
      fileSize: item.fileSize,
      checksumSha256: item.checksumSha256,
      capturedAt: item.capturedAt,
    })
    const mediaPath = `/media/${encodeURIComponent(plan.mediaId)}`
    if (plan.status === 'AVAILABLE') return plan.mediaId
    if (plan.status === 'VALIDATING') return plan.mediaId
    if (plan.status === 'RETRY_REQUIRED' || plan.status === 'MANUAL_UPLOAD_REQUIRED') {
      const retryPath = plan.status === 'MANUAL_UPLOAD_REQUIRED'
        ? `${mediaPath}/manual-upload-attempts`
        : `${mediaPath}/upload-attempts`
      plan = await backend<UploadPlan>(retryPath, 'POST')
    }
    if (!plan.uploadMethod || !plan.attemptId) throw new Error('No upload attempt available')
    const attemptPath = `${mediaPath}/upload-attempts/${encodeURIComponent(plan.attemptId)}`
    const partUrls: Array<{ partNumber: number; uploadUrl: string; uploadHeaders: Record<string, string[]> }> = []
    if (plan.uploadMethod === 'MULTIPART') {
      for (let partNumber = 1; partNumber <= plan.partCount; partNumber++) {
        const part = await backend<UploadPlan>(`${attemptPath}/parts/${partNumber}/url`, 'POST')
        if (!part.uploadUrl) throw new Error(`Missing signed URL for part ${partNumber}`)
        partUrls.push({ partNumber, uploadUrl: part.uploadUrl, uploadHeaders: part.uploadHeaders })
      }
    }
    let transferred: { parts: Array<{ partNumber: number; eTag: string }> }
    try {
      transferred = await controller<{ parts: Array<{ partNumber: number; eTag: string }> }>(
        `/api/media/local/${encodeURIComponent(item.localMediaId)}/transfer`, 'POST', { ...plan, partUrls },
      )
    } catch (error) {
      await backend(`${attemptPath}/failures`, 'POST', {
        code: 'TRANSFER_FAILED', message: error instanceof Error ? error.message.slice(0, 400) : 'Transfer failed',
      }).catch(() => undefined)
      throw error
    }
    // An acknowledgement failure is not an S3 transfer failure. The object may
    // already be in S3 (and its ObjectCreated event may already be processing).
    if (plan.uploadMethod === 'MULTIPART') {
      await backend(`${attemptPath}/complete-multipart`, 'POST', { parts: transferred.parts })
    } else {
      await backend(`${attemptPath}/uploaded`, 'POST')
    }
    return plan.mediaId
  },
  status(mediaId: string) {
    return backend<UploadPlan>(`/media/${encodeURIComponent(mediaId)}/upload-status`)
  },
}
