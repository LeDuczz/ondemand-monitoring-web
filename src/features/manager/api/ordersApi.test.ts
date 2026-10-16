import { afterEach, describe, expect, it } from 'vitest'

import {
  resetHttpTransport,
  setHttpTransport,
} from '../../../shared/api/httpClient'
import { stubApi, stubError } from '../../../test/stubApi'
import { ordersApi } from './ordersApi'

describe('ordersApi (mock mode)', () => {
  afterEach(() => {
    resetHttpTransport()
  })

  it('getQueue GETs /api/orders/pending', async () => {
    const stub = stubApi([
      {
        path: '/api/orders/pending',
        respond: [{ id: 'ord-2609-0157' }, { id: 'ord-2609-0158' }],
      },
    ])
    const rows = await ordersApi.getQueue()
    expect(rows).toHaveLength(2)
    expect(rows[0].id).toBe('ord-2609-0157')
    expect(stub.calls[0]).toMatchObject({ method: 'GET', path: '/api/orders/pending' })
  })

  it('getOrder maps the order DTO to the full detail', async () => {
    stubApi([
      {
        path: '/api/orders/:id',
        respond: ({ params }) => ({
          id: params.id,
          customerId: 'customer-1',
          customerName: 'Lê Quốc Bảo',
          title: 'Chụp ảnh',
          serviceId: 'service-1',
          serviceName: 'Giám sát',
          address: 'Khu A',
          latitude: 10.6,
          longitude: 106.7,
          radiusM: 600,
          orderStatus: 'PENDING',
          preferredDateFrom: '2026-09-24',
          preferredDateTo: '2026-09-24',
          createdAt: '2026-09-24T08:00:00Z',
          updatedAt: '2026-09-24T08:00:00Z',
          deliverables: [],
        }),
      },
    ])
    const detail = await ordersApi.getOrder('ord-2609-0157')
    expect(detail.customer.fullName).toBe('Lê Quốc Bảo')
    expect(detail.radiusM).toBe(600)
  })

  it('maps the backend order DTO to the existing review UI', async () => {
    setHttpTransport(
      async () =>
        new Response(
          JSON.stringify({
            success: true,
            data: {
              id: 'order-real',
              customerId: 'customer-1',
              customerName: 'Khách hàng A',
              title: 'Chụp ảnh',
              serviceId: 'service-1',
              serviceName: 'Giám sát',
              description: 'Kiểm tra',
              address: 'Khu A',
              latitude: 10.6,
              longitude: 106.7,
              radiusM: 250,
              coverageArea: null,
              preferredDateFrom: '2026-09-24',
              preferredDateTo: '2026-09-24',
              preferredTimeId: 'morning',
              preferredTimeName: 'Buổi sáng',
              orderStatus: 'PENDING',
              rejectReason: null,
              reviewById: null,
              reviewByName: null,
              reviewAt: null,
              createdAt: '2026-09-24T08:00:00Z',
              updatedAt: '2026-09-24T08:00:00Z',
              deliverables: [],
            },
          }),
          { status: 200 },
        ),
    )
    const detail = await ordersApi.getOrder('order-real')
    expect(detail.customer.fullName).toBe('Khách hàng A')
    expect(detail.center).toEqual({ lat: 10.6, lon: 106.7 })
    expect(detail.radiusM).toBe(250)
    expect(detail.code).toBe('order-real')
  })

  it('formats backend deliverable requirements instead of exposing raw JSON', async () => {
    setHttpTransport(
      async () =>
        new Response(
          JSON.stringify({
            success: true,
            data: {
              id: 'order-real',
              customerId: 'customer-1',
              customerName: 'Khách hàng A',
              title: 'Chụp ảnh',
              serviceId: 'service-1',
              serviceName: 'Giám sát',
              description: 'Kiểm tra',
              address: 'Khu A',
              latitude: 10.6,
              longitude: 106.7,
              coverageArea: null,
              preferredDateFrom: '2026-09-24',
              preferredDateTo: '2026-09-24',
              preferredTimeId: 'morning',
              preferredTimeName: 'Buổi sáng',
              orderStatus: 'PENDING',
              rejectReason: null,
              reviewById: null,
              reviewByName: null,
              reviewAt: null,
              createdAt: '2026-09-24T08:00:00Z',
              updatedAt: '2026-09-24T08:00:00Z',
              deliverables: [
                {
                  id: 'del-1',
                  deliverableTypeId: 'thermal',
                  deliverableTypeName: 'Báo cáo Phân tích Nhiệt',
                  defaultFormat: 'PDF',
                  requirement: {
                    radiusM: 100,
                    quantity: 10,
                    mediaType: 'IMAGE',
                    resolution: '4K',
                    estimatedAreaHa: 3.1,
                  },
                },
              ],
            },
          }),
          { status: 200 },
        ),
    )
    const detail = await ordersApi.getOrder('order-real')
    expect(detail.mediaRequirements?.[0].label).toBe(
      'Báo cáo Phân tích Nhiệt · IMAGE · 10 mục · 4K · 100 m · 3.1 ha',
    )
    expect(detail.radiusM).toBe(100)
    expect(detail.mediaRequirements?.[0].label).not.toContain('{')
  })

  it('getLatestAnalysis GETs /api/orders/{id}/analysis/latest', async () => {
    const stub = stubApi([
      {
        path: '/api/orders/:id/analysis/latest',
        respond: { overallVerdict: 'FEASIBLE', findings: [{ id: 'f1' }, { id: 'f2' }] },
      },
    ])
    const analysis = await ordersApi.getLatestAnalysis('ord-2609-0157')
    expect(analysis.overallVerdict).toBe('FEASIBLE')
    expect(analysis.findings).toHaveLength(2)
    expect(stub.calls[0].path).toBe('/api/orders/ord-2609-0157/analysis/latest')
  })

  it('getResourcePreview GETs the preview panel', async () => {
    const stub = stubApi([
      {
        path: '/api/orders/:id/resource-preview',
        respond: { eligibleDroneCount: 4, topDrones: [{ name: 'DRN-06 Cú Mèo' }] },
      },
    ])
    const preview = await ordersApi.getResourcePreview('ord-2609-0157')
    expect(preview?.eligibleDroneCount).toBe(4)
    expect(preview?.topDrones[0].name).toBe('DRN-06 Cú Mèo')
    expect(stub.calls[0].path).toBe('/api/orders/ord-2609-0157/resource-preview')
  })

  it('getResourcePreview resolves null for an order without source content', async () => {
    stubApi([{ path: '/api/orders/:id/resource-preview', respond: null }])
    expect(await ordersApi.getResourcePreview('ord-2609-0149')).toBeNull()
  })

  it('saveInternalNote PUTs the note', async () => {
    const stub = stubApi([
      {
        method: 'PUT',
        path: '/api/orders/:id/internal-note',
        respond: ({ body }) => ({ note: (body as { note: string }).note }),
      },
    ])
    const saved = await ordersApi.saveInternalNote('ord-2609-0157', 'Ghi chú mới')
    expect(saved.note).toBe('Ghi chú mới')
    expect(stub.calls[0]).toMatchObject({
      method: 'PUT',
      path: '/api/orders/ord-2609-0157/internal-note',
      body: { note: 'Ghi chú mới' },
    })
  })

  it('approve POSTs /api/orders/{id}/approve and returns the order', async () => {
    const stub = stubApi([
      {
        method: 'POST',
        path: '/api/orders/:id/approve',
        respond: ({ params }) => ({ id: params.id, orderStatus: 'APPROVED' }),
      },
    ])
    await expect(ordersApi.approve('ord-2609-0157')).resolves.toMatchObject({
      id: 'ord-2609-0157',
      orderStatus: 'APPROVED',
    })
    expect(stub.calls[0]).toMatchObject({
      method: 'POST',
      path: '/api/orders/ord-2609-0157/approve',
    })
  })

  it('returns the approved order from the real approve endpoint', async () => {
    setHttpTransport(
      async () =>
        new Response(
          JSON.stringify({
            success: true,
            data: {
              id: 'order-real',
              orderStatus: 'APPROVED',
            },
          }),
          { status: 200 },
        ),
    )
    await expect(ordersApi.approve('order-real')).resolves.toMatchObject({
      id: 'order-real',
      orderStatus: 'APPROVED',
    })
  })

  it('submitApproval REJECTED POSTs the decision', async () => {
    const stub = stubApi([
      { method: 'POST', path: '/api/orders/:id/approval' },
    ])
    await expect(
      ordersApi.submitApproval('ord-2609-0157', {
        decision: 'REJECTED',
        reason: 'Vùng cấm bay',
      }),
    ).resolves.toBeUndefined()
    expect(stub.calls[0]).toMatchObject({
      path: '/api/orders/ord-2609-0157/approval',
      body: { decision: 'REJECTED', reason: 'Vùng cấm bay' },
    })
  })

  it('getOrderForMission builds the brief from an APPROVED order', async () => {
    stubApi([
      {
        path: '/api/orders/:id',
        respond: ({ params }) => ({
          id: params.id,
          customerName: 'Trần Thị Thu Hà',
          title: 'Chụp ảnh',
          latitude: 10.6402,
          longitude: 106.74,
          orderStatus: 'APPROVED',
          deliverables: [],
        }),
      },
    ])
    const brief = await ordersApi.getOrderForMission('ord-2609-0153')
    expect(brief.customerFullName).toBe('Trần Thị Thu Hà')
    expect(brief.center).toEqual({ lat: 10.6402, lon: 106.74 })
  })

  it('getOrderForMission falls back to mission-brief for a PENDING order', async () => {
    const stub = stubApi([
      {
        path: '/api/orders/:id',
        respond: ({ params }) => ({ id: params.id, orderStatus: 'PENDING', deliverables: [] }),
      },
      { path: '/api/orders/:id/mission-brief', respond: stubError(409, 'ORDER_NOT_APPROVED') },
    ])
    await expect(
      ordersApi.getOrderForMission('ord-2609-0157'),
    ).rejects.toMatchObject({ status: 409 })
    expect(stub.calls.map((c) => c.path)).toEqual([
      '/api/orders/ord-2609-0157',
      '/api/orders/ord-2609-0157/mission-brief',
    ])
  })
})
