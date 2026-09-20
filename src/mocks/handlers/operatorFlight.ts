import { registerMockRoutes, ok, fail } from '../mockServer'
import mediaData from '../data/operator-media.json'
import missionsData from '../data/operator-missions.json'
import type { MediaFile } from '../../features/drone-operator/omss/types'

// In-memory media store per mission
const mediaStore: Record<string, MediaFile[]> = {
  [mediaData.missionId]: mediaData.files as MediaFile[],
}

registerMockRoutes([
  // POST connect GCS
  {
    method: 'POST',
    path: '/api/operator/missions/:id/connect',
    handler: ({ params, body }) => {
      const payload = body as { token?: string; gcsId?: string }
      if (!payload?.token) {
        return fail(400, 'BAD_REQUEST', 'Thiếu token kết nối')
      }
      const device = missionsData.gcsDevices.find(
        (d) => d.id === payload.gcsId,
      )
      return ok({
        connection: {
          id: `CONN-${Date.now()}`,
          missionId: params['id'],
          droneId: 'DRN-02',
          gcsId: payload.gcsId ?? '',
          tokenUsedAt: new Date().toISOString(),
          connectedAt: new Date().toISOString(),
          status: 'CONNECTED',
        },
        gcsDevices: missionsData.gcsDevices,
        gcsLabel: device?.label ?? payload.gcsId,
      })
    },
  },

  // POST confirm handover
  {
    method: 'POST',
    path: '/api/operator/missions/:id/handover',
    handler: () => ok({ confirmedAt: new Date().toISOString() }),
  },

  // POST save preflight results
  {
    method: 'POST',
    path: '/api/operator/missions/:id/preflight',
    handler: ({ body }) => {
      const payload = body as { items?: Array<{ id: string; status: string }> }
      const anyFail = payload?.items?.some((i) => i.status === 'FAIL') ?? false
      return ok({ result: anyFail ? 'FAIL' : 'PASS' })
    },
  },

  // POST save postflight
  {
    method: 'POST',
    path: '/api/operator/missions/:id/postflight',
    handler: ({ params }) => {
      return ok({ id: params['id'], state: 'COMPLETED' })
    },
  },

  // POST create maintenance ticket
  {
    method: 'POST',
    path: '/api/operator/missions/:id/maintenance-ticket',
    handler: () =>
      ok({
        ticketId: `TKT-${Date.now()}`,
        createdAt: new Date().toISOString(),
      }),
  },

  // GET media files
  {
    method: 'GET',
    path: '/api/operator/missions/:id/media',
    handler: ({ params }) => {
      const files = mediaStore[params['id']] ?? []
      return ok({ files })
    },
  },

  // POST retry media upload
  {
    method: 'POST',
    path: '/api/operator/missions/:id/media/:fileId/retry',
    handler: ({ params }) => {
      const files = mediaStore[params['id']]
      if (!files) return fail(404, 'NOT_FOUND', 'Mission không tồn tại')
      const idx = files.findIndex((f) => f.id === params['fileId'])
      if (idx === -1) return fail(404, 'NOT_FOUND', 'File không tồn tại')
      const file = files[idx]!
      if (file.attempts >= file.maxAttempts) {
        return fail(
          422,
          'MAX_RETRIES',
          'Đã đạt số lần thử tối đa. Yêu cầu xử lý thủ công.',
        )
      }
      files[idx] = { ...file, status: 'UPLOADING', attempts: file.attempts + 1, progressPct: 0 }
      return ok(files[idx])
    },
  },
])
