import { describe, expect, it } from 'vitest'

import { env } from '../../config/env'
import { mockFetch } from '../mockServer'
import '../index'

async function call(path: string) {
  const response = await mockFetch(`${env.apiBaseUrl}${path}`)
  return { status: response.status, payload: await response.json() }
}

describe('GET /api/customer/mission-history (BE PageResponse shape)', () => {
  it('returns a page of completed / failed / cancelled missions', async () => {
    const { status, payload } = await call('/api/customer/mission-history?page=0&size=20')
    expect(status).toBe(200)
    expect(payload.data).toMatchObject({ page: 0, size: 20, totalItems: 3, totalPages: 1, first: true, last: true })
    for (const m of payload.data.items) {
      expect(['COMPLETED', 'FAILED', 'CANCELLED']).toContain(m.status)
      expect(m).toHaveProperty('missionCode')
      expect(m).toHaveProperty('orderId')
    }
  })

  it('pages with size', async () => {
    const { payload } = await call('/api/customer/mission-history?page=1&size=2')
    expect(payload.data.items).toHaveLength(1)
    expect(payload.data).toMatchObject({ totalPages: 2, first: false, last: true })
  })

  it('returns one mission or 404', async () => {
    expect((await call('/api/customer/mission-history/msn-006-1')).payload.data.id).toBe('msn-006-1')
    expect((await call('/api/customer/mission-history/nope')).status).toBe(404)
  })
})
