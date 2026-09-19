import { afterEach, describe, expect, it } from 'vitest'

import {
  resetHttpTransport,
  setHttpTransport,
} from '../../../shared/api/httpClient'
import { resetMockDb } from '../../../mocks/db'
import { mockFetch } from '../../../mocks'
import { ordersApi } from './ordersApi'

describe('ordersApi (mock mode)', () => {
  afterEach(() => {
    resetHttpTransport()
    resetMockDb()
  })

  it('getQueue resolves the 6 PENDING rows', async () => {
    setHttpTransport(mockFetch)
    const rows = await ordersApi.getQueue()
    expect(rows).toHaveLength(6)
    expect(rows[0].code).toBe('ORD-2609-0157')
  })

  it('getOrder resolves full detail', async () => {
    setHttpTransport(mockFetch)
    const detail = await ordersApi.getOrder('ord-2609-0157')
    expect(detail.customer.fullName).toBe('Lê Quốc Bảo')
    expect(detail.radiusM).toBe(600)
  })

  it('getLatestAnalysis resolves findings for a known order', async () => {
    setHttpTransport(mockFetch)
    const analysis = await ordersApi.getLatestAnalysis('ord-2609-0157')
    expect(analysis.overallVerdict).toBe('FEASIBLE')
    expect(analysis.findings).toHaveLength(2)
  })
})
