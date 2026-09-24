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
    expect(rows[0].id).toBe('ord-2609-0157')
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

  it('getResourcePreview resolves the preview panel for a sourced order', async () => {
    setHttpTransport(mockFetch)
    const preview = await ordersApi.getResourcePreview('ord-2609-0157')
    expect(preview).not.toBeNull()
    expect(preview?.eligibleDroneCount).toBe(4)
    expect(preview?.topDrones[0].name).toBe('DRN-06 Cú Mèo')
  })

  it('getResourcePreview resolves null for an order without source content', async () => {
    setHttpTransport(mockFetch)
    const preview = await ordersApi.getResourcePreview('ord-2609-0149')
    expect(preview).toBeNull()
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

  it('getOrderForMission resolves the seeded APPROVED order', async () => {
    setHttpTransport(mockFetch)
    const brief = await ordersApi.getOrderForMission('ord-2609-0153')
    expect(brief.customerFullName).toBe('Trần Thị Thu Hà')
    expect(brief.center).toEqual({ lat: 10.6402, lon: 106.74 })
  })

  it('getOrderForMission 409s for a PENDING order', async () => {
    setHttpTransport(mockFetch)
    await expect(
      ordersApi.getOrderForMission('ord-2609-0157'),
    ).rejects.toMatchObject({ status: 409 })
  })
})
