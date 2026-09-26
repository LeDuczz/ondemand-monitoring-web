import { env } from '../../../config/env'
import { authenticatedFetch } from '../../auth/api/authApi'
import { transferPcBackup, verifyPcBackup } from './pcMediaTransfer'

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
  status: 'REVIEW_PENDING' | 'UPLOADING' | 'UPLOAD_FAILED' | 'VALIDATING' | 'MANUAL_UPLOAD_REQUIRED' | 'UPLOAD_PENDING' | 'AVAILABLE'
  previewError?: string
  backendMediaId?: string
  manualTaskId?: string
  reason?: string
  localAvailable?: boolean
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
  attemptNumber: number
  manualTaskId?: string
}

class RetryableTransferError extends Error {}
const activeUploads = new Map<string, Promise<string>>()
const delay = (milliseconds: number) => new Promise<void>((resolve) => window.setTimeout(resolve, milliseconds))
const referenceKey = (item: Pick<LocalMedia, 'missionId' | 'localMediaId'>) =>
  `odms.media-upload:${item.missionId}:${item.localMediaId}`

function storedMediaId(item: LocalMedia): string | undefined {
  try { return window.localStorage.getItem(referenceKey(item)) ?? undefined }
  catch { return undefined }
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
    signal: AbortSignal.timeout(path.endsWith('/transfer') ? 1800000 : 10000),
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
      .map((item) => ({ ...item, backendMediaId: item.backendMediaId ?? storedMediaId(item) }))
  },
  manualTasks(missionId: string) {
    return backend<LocalMedia[]>(`/missions/${encodeURIComponent(missionId)}/manual-media-uploads`)
  },
  async reviewItems(missionId: string): Promise<LocalMedia[]> {
    const [local, tasks] = await Promise.all([
      operatorMediaApi.list(missionId).catch(() => [] as LocalMedia[]),
      operatorMediaApi.manualTasks(missionId),
    ])
    const merged = new Map(local.map((item) => [item.localMediaId, { ...item, localAvailable: true }]))
    for (const task of tasks) {
      merged.set(task.localMediaId, { ...merged.get(task.localMediaId), ...task,
        localAvailable: merged.has(task.localMediaId) })
    }
    return [...merged.values()]
  },
  async uploadPcBackup(item: LocalMedia, file: File): Promise<string> {
    if (!item.backendMediaId || !item.manualTaskId) throw new Error('Không có manual task cho media này.')
    const key = `${item.missionId}:${item.localMediaId}`
    if (activeUploads.has(key)) throw new Error('Media đang được upload. Vui lòng chờ.')
    const operation = (async () => {
      const checksumSha256 = await verifyPcBackup(file, item)
      const mediaPath = `/media/${encodeURIComponent(item.backendMediaId!)}`
      const plan = await backend<UploadPlan>(`${mediaPath}/manual-file-upload`, 'POST', {
        fileSize: file.size, contentType: item.contentType, checksumSha256,
      })
      if (['AVAILABLE', 'VALIDATING'].includes(plan.status)) return plan.mediaId
      const attemptPath = `${mediaPath}/upload-attempts/${encodeURIComponent(plan.attemptId)}`
      let parts: Array<{ partNumber: number; eTag: string }>
      try {
        parts = await transferPcBackup(file, plan,
          (partNumber) => backend<UploadPlan>(`${attemptPath}/parts/${partNumber}/url`, 'POST'))
      } catch (error) {
        const result = await backend<UploadPlan>(`${attemptPath}/failures`, 'POST', {
          code: 'PC_TRANSFER_FAILED', message: error instanceof Error ? error.message.slice(0, 400) : 'PC transfer failed',
        })
        if (['AVAILABLE', 'VALIDATING'].includes(result.status)) return plan.mediaId
        throw error
      }
      // An ambiguous completion response is not a failed transfer; retain this attempt for recovery.
      await backend(plan.uploadMethod === 'MULTIPART' ? `${attemptPath}/complete-multipart` : `${attemptPath}/uploaded`,
        'POST', plan.uploadMethod === 'MULTIPART' ? { parts } : undefined)
      return plan.mediaId
    })()
    activeUploads.set(key, operation)
    try { return await operation } finally { activeUploads.delete(key) }
  },
  discard(id: string) {
    return controller(`/api/media/local/${encodeURIComponent(id)}/discard`, 'POST')
  },
  upload(item: LocalMedia, manual = false): Promise<string> {
    const key = `${item.missionId}:${item.localMediaId}`
    const active = activeUploads.get(key)
    if (active) return active
    const operation = (async () => {
      for (let retry = 0; retry < 3; retry++) {
        try {
          return await operatorMediaApi.transfer(item, manual)
        } catch (error) {
          // Only a backend-confirmed transfer failure permits a new attempt.
          // Authorization/acknowledgement errors never consume another transfer.
          if (manual || !(error instanceof RetryableTransferError) || retry === 2) throw error
          await delay(2000 * 2 ** retry + Math.floor(Math.random() * 500))
        }
      }
      throw new Error('Automatic upload attempts exhausted')
    })()
    activeUploads.set(key, operation)
    void operation.finally(() => activeUploads.delete(key)).catch(() => undefined)
    return operation
  },
  async transfer(item: LocalMedia, manual: boolean): Promise<string> {
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
    // Persist only the correlation ID, never credentials or signed URLs.
    try { window.localStorage.setItem(referenceKey(item), plan.mediaId) } catch { /* Storage may be disabled. */ }
    const mediaPath = `/media/${encodeURIComponent(plan.mediaId)}`
    if (plan.status === 'AVAILABLE') return plan.mediaId
    if (plan.status === 'VALIDATING') return plan.mediaId
    if (plan.status === 'MANUAL_UPLOAD_REQUIRED' && !manual) {
      throw new Error('Đã hết 3 lần upload tự động. Hãy chọn upload thủ công; bản gốc vẫn được giữ trên Flight Controller.')
    }
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
      const failure = await backend<UploadPlan>(`${attemptPath}/failures`, 'POST', {
        code: 'TRANSFER_FAILED', message: error instanceof Error ? error.message.slice(0, 400) : 'Transfer failed',
      })
      if (failure.status === 'AVAILABLE' || failure.status === 'VALIDATING') return plan.mediaId
      if (failure.status === 'RETRY_REQUIRED') {
        throw new RetryableTransferError(error instanceof Error ? error.message : 'Transfer failed')
      }
      throw new Error('Upload thất bại. Task upload thủ công đã được tạo; bản gốc vẫn được giữ trên Flight Controller.')
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
