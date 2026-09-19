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

  it('getResourcePreview resolves the preview panel', async () => {
    setHttpTransport(mockFetch)
    const preview = await ordersApi.getResourcePreview('ord-2609-0157')
    expect(preview.eligibleDroneCount).toBe(4)
    expect(preview.topDrones[0].name).toBe('DRN-06 Cú Mèo')
  })

  it('saveInternalNote upserts the note', async () => {
    setHttpTransport(mockFetch)
    const saved = await ordersApi.saveInternalNote(
      'ord-2609-0157',
      'Ghi chú mới',
    )
    expect(saved.note).toBe('Ghi chú mới')
    expect(saved.authorName).toBe('Lê Thị Thanh Hằng')
  })

  it('approve resolves without throwing', async () => {
    setHttpTransport(mockFetch)
    await expect(ordersApi.approve('ord-2609-0157')).resolves.toBeUndefined()
  })

  it('submitApproval REJECTED resolves without throwing', async () => {
    setHttpTransport(mockFetch)
    await expect(
      ordersApi.submitApproval('ord-2609-0157', {
        decision: 'REJECTED',
        reason: 'Vùng cấm bay',
      }),
    ).resolves.toBeUndefined()
  })
})
