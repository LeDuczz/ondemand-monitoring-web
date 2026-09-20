// Mock handlers for Admin AI knowledge APIs:
//   GET  /api/admin/ai-knowledge/docs
//   POST /api/admin/ai-knowledge/docs
//   POST /api/admin/ai-knowledge/docs/:id/reindex
//   GET  /api/admin/ai-knowledge/rules
//   PATCH /api/admin/ai-knowledge/rules/:id
import { createCollection } from '../db'
import { fail, ok, registerMockRoutes } from '../mockServer'
import seedData from '../data/admin-ai-knowledge.json'

type DocSeed = (typeof seedData.docs)[number]
type RuleSeed = (typeof seedData.feasibilityRules)[number]

const docs = createCollection(seedData.docs as DocSeed[]) as unknown as DocSeed[]
const rules = createCollection(seedData.feasibilityRules as RuleSeed[]) as unknown as RuleSeed[]

registerMockRoutes([
  {
    method: 'GET',
    path: '/api/admin/ai-knowledge/docs',
    handler: () => ok({ items: [...docs] }),
  },

  {
    method: 'POST',
    path: '/api/admin/ai-knowledge/docs',
    handler: ({ body }) => {
      const payload = body as { title?: string; docType?: string; version?: string; effectiveFrom?: string }
      if (!payload.title?.trim())
        return fail(400, 'VALIDATION_ERROR', 'Tiêu đề là bắt buộc.', { title: 'Bắt buộc' })
      if (!payload.docType)
        return fail(400, 'VALIDATION_ERROR', 'Loại tài liệu là bắt buộc.', { docType: 'Bắt buộc' })
      const newDoc = {
        id: `doc-new-${Date.now()}`,
        title: payload.title.trim(),
        docType: payload.docType,
        version: payload.version ?? '1.0',
        effectiveFrom: payload.effectiveFrom ?? new Date().toISOString().slice(0, 10),
        status: 'PENDING' as const,
        chunkCount: null,
      }
      docs.push(newDoc as DocSeed)
      return ok(newDoc)
    },
  },

  {
    method: 'POST',
    path: '/api/admin/ai-knowledge/docs/:id/reindex',
    handler: ({ params }) => {
      const doc = docs.find((d) => d.id === params.id)
      if (!doc) return fail(404, 'NOT_FOUND', 'Không tìm thấy tài liệu.')
      doc.status = 'PENDING'
      doc.chunkCount = null
      return ok(doc)
    },
  },

  {
    method: 'GET',
    path: '/api/admin/ai-knowledge/rules',
    handler: () => ok({ items: [...rules] }),
  },

  {
    method: 'PATCH',
    path: '/api/admin/ai-knowledge/rules/:id',
    handler: ({ params, body }) => {
      const rule = rules.find((r) => r.id === params.id)
      if (!rule) return fail(404, 'NOT_FOUND', 'Không tìm thấy luật.')
      const payload = body as { severity?: string; weight?: number; isActive?: boolean }
      if (payload.severity !== undefined) rule.severity = payload.severity as RuleSeed['severity']
      if (payload.weight !== undefined) rule.weight = payload.weight
      if (payload.isActive !== undefined) rule.isActive = payload.isActive
      return ok(rule)
    },
  },
])
