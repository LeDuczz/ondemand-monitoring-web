/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { env } from '../../config/env'
import { resetMockDb } from '../db'
import { mockFetch } from '../mockServer'
import '../index'

const base = env.apiBaseUrl

async function call(method: string, path: string, body?: unknown) {
  const response = await mockFetch(`${base}${path}`, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  return { status: response.status, payload: await response.json() }
}

beforeEach(() => resetMockDb())
afterEach(() => resetMockDb())

describe('GET /api/admin/ai-knowledge/docs', () => {
  it('returns docs', async () => {
    const { status, payload } = await call('GET', '/api/admin/ai-knowledge/docs')
    expect(status).toBe(200)
    expect(Array.isArray(payload.data.items)).toBe(true)
    expect(payload.data.items.length).toBe(7)
  })

  it('has docs with FAILED status', async () => {
    const { payload } = await call('GET', '/api/admin/ai-knowledge/docs')
    const failed = (payload.data.items as any[]).filter((d) => d.status === 'FAILED')
    expect(failed.length).toBeGreaterThan(0)
  })
})

describe('POST /api/admin/ai-knowledge/docs', () => {
  it('creates a new doc', async () => {
    const { status, payload } = await call('POST', '/api/admin/ai-knowledge/docs', {
      title: 'Test Doc',
      docType: 'SOP',
      version: '1.0',
      effectiveFrom: '2026-10-01',
    })
    expect(status).toBe(200)
    expect(payload.data.title).toBe('Test Doc')
    expect(payload.data.status).toBe('PENDING')
    expect(payload.data.chunkCount).toBeNull()
  })

  it('returns 400 when title missing', async () => {
    const { status } = await call('POST', '/api/admin/ai-knowledge/docs', { docType: 'SOP' })
    expect(status).toBe(400)
  })
})

describe('POST /api/admin/ai-knowledge/docs/:id/reindex', () => {
  it('sets doc to PENDING', async () => {
    const listRes = await call('GET', '/api/admin/ai-knowledge/docs')
    const indexed = listRes.payload.data.items.find((d: any) => d.status === 'INDEXED')
    const { status, payload } = await call('POST', `/api/admin/ai-knowledge/docs/${indexed.id}/reindex`)
    expect(status).toBe(200)
    expect(payload.data.status).toBe('PENDING')
  })

  it('returns 404 for unknown doc', async () => {
    const { status } = await call('POST', '/api/admin/ai-knowledge/docs/nope/reindex')
    expect(status).toBe(404)
  })
})

describe('GET /api/admin/ai-knowledge/rules', () => {
  it('returns rules', async () => {
    const { status, payload } = await call('GET', '/api/admin/ai-knowledge/rules')
    expect(status).toBe(200)
    expect(Array.isArray(payload.data.items)).toBe(true)
    expect(payload.data.items.length).toBe(10)
  })
})

describe('PATCH /api/admin/ai-knowledge/rules/:id', () => {
  it('updates rule severity', async () => {
    const listRes = await call('GET', '/api/admin/ai-knowledge/rules')
    const rule = listRes.payload.data.items.find((r: any) => r.severity === 'BLOCKER')
    const { status, payload } = await call('PATCH', `/api/admin/ai-knowledge/rules/${rule.id}`, { severity: 'WARNING' })
    expect(status).toBe(200)
    expect(payload.data.severity).toBe('WARNING')
  })

  it('updates rule weight', async () => {
    const listRes = await call('GET', '/api/admin/ai-knowledge/rules')
    const ruleId = listRes.payload.data.items[0].id
    const { payload } = await call('PATCH', `/api/admin/ai-knowledge/rules/${ruleId}`, { weight: 75 })
    expect(payload.data.weight).toBe(75)
  })

  it('toggles isActive', async () => {
    const listRes = await call('GET', '/api/admin/ai-knowledge/rules')
    const rule = listRes.payload.data.items.find((r: any) => r.isActive)
    await call('PATCH', `/api/admin/ai-knowledge/rules/${rule.id}`, { isActive: false })
    const { payload } = await call('GET', '/api/admin/ai-knowledge/rules')
    const updated = payload.data.items.find((r: any) => r.id === rule.id)
    expect(updated.isActive).toBe(false)
  })
})

describe('GET /api/admin/ai-knowledge/analysis-logs', () => {
  it('returns analysis logs sorted by createdAt desc', async () => {
    const { status, payload } = await call('GET', '/api/admin/ai-knowledge/analysis-logs')
    expect(status).toBe(200)
    expect(Array.isArray(payload.data.items)).toBe(true)
    expect(payload.data.items.length).toBe(10)
    const dates = (payload.data.items as any[]).map((i) => new Date(i.createdAt).getTime())
    expect(dates).toEqual([...dates].sort((a, b) => b - a))
  })

  it('has items with overallVerdict and rule/llm metrics', async () => {
    const { payload } = await call('GET', '/api/admin/ai-knowledge/analysis-logs')
    const first = payload.data.items[0]
    expect(['FEASIBLE', 'RISKY', 'INFEASIBLE']).toContain(first.overallVerdict)
    expect(typeof first.ruleEngineMs).toBe('number')
    expect(typeof first.llmTokens).toBe('number')
  })
})
