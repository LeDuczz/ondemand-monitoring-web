// Mock handlers for MNG-11. Endpoints:
//   GET  /api/media?needs_action=true            [TK]
//   POST /api/manual-upload-tasks/:id/reassign   [ĐỀ XUẤT]
//   POST /api/media/:id/request-reupload         [ĐỀ XUẤT]
import { createCollection } from '../db'
import { fail, ok, registerMockRoutes } from '../mockServer'
import mediaSeed from '../data/media-items.json'

type StoredTask = (typeof mediaSeed.manualUploadTasks)[number]
type StoredBadMedia = (typeof mediaSeed.badMediaItems)[number]
type StoredWaitingMission = (typeof mediaSeed.waitingDeliveryMissions)[number]

const manualUploadTasks = createCollection(
  mediaSeed.manualUploadTasks,
) as StoredTask[]
const badMediaItems = createCollection(
  mediaSeed.badMediaItems,
) as StoredBadMedia[]
const waitingDeliveryMissions = createCollection(
  mediaSeed.waitingDeliveryMissions,
) as StoredWaitingMission[]

registerMockRoutes([
  // ── MNG-11: list media items needing action [TK] ───────────────────────
  {
    method: 'GET',
    path: '/api/media',
    handler: ({ query }) => {
      const needsAction = query.get('needs_action')
      if (needsAction !== 'true') {
        return ok({ manualUploadTasks: [], badMediaItems: [], waitingDeliveryMissions: [] })
      }
      return ok({
        manualUploadTasks: [...manualUploadTasks],
        badMediaItems: [...badMediaItems],
        waitingDeliveryMissions: [...waitingDeliveryMissions],
      })
    },
  },

  // ── POST /api/manual-upload-tasks/:id/reassign [ĐỀ XUẤT] ─────────────
  {
    method: 'POST',
    path: '/api/manual-upload-tasks/:id/reassign',
    handler: ({ params, body }) => {
      const task = manualUploadTasks.find((t) => t.id === params['id'])
      if (!task) return fail(404, 'NOT_FOUND', 'Không tìm thấy tác vụ')
      const b = body as { operatorId?: string }
      if (!b?.operatorId) {
        return fail(400, 'BAD_REQUEST', 'operatorId là bắt buộc')
      }
      const op = mediaSeed.operators.find((o) => o.id === b.operatorId)
      task.assignedOperatorId = b.operatorId
      task.assignedOperatorName = op?.name ?? b.operatorId
      return ok(task)
    },
  },

  // ── POST /api/media/:id/request-reupload [ĐỀ XUẤT] ───────────────────
  {
    method: 'POST',
    path: '/api/media/:id/request-reupload',
    handler: ({ params, body }) => {
      const media = badMediaItems.find((m) => m.id === params['id'])
      if (!media) return fail(404, 'NOT_FOUND', 'Không tìm thấy media')
      const b = body as { reason?: string }
      if (!b?.reason) {
        return fail(400, 'BAD_REQUEST', 'reason là bắt buộc')
      }
      // reset to PENDING_UPLOAD
      ;(media as Record<string, unknown>)['mediaStatus'] = 'PENDING_UPLOAD'
      return ok({ ...media, mediaStatus: 'PENDING_UPLOAD', note: b.reason })
    },
  },
])
