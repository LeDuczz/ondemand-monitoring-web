/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { env } from '../../config/env'
import { resetMockDb } from '../db'
import { mockFetch } from '../mockServer'
import '../index'

async function call(method: string, path: string, body?: unknown) {
  const response = await mockFetch(`${env.apiBaseUrl}${path}`, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  return { status: response.status, payload: await response.json() }
}

const serviceCatalogContext = [
  'Danh sách service active từ BE:',
  '- svc-2 | Giám sát Tiến độ Xây dựng | Theo dõi công trình xây dựng, công trường, tiến độ thi công và hiện trạng khu vực làm việc bằng ảnh/video.',
  '- svc-5 | Giám sát Đập nước / Hồ chứa | Giám sát khu vực đập nước, hồ chứa, cửa xả, thân đập và vùng thượng/hạ lưu.',
].join('\n')

const constructionContext = [
  'Thông tin vị trí/phạm vi từ Step 1:',
  '- Địa chỉ/khu vực: Công trường xây dựng.',
  '- Vùng map nhận diện: Công trường xây dựng.',
  '',
  serviceCatalogContext,
].join('\n')

beforeEach(() => resetMockDb())
afterEach(() => resetMockDb())

describe('/api/services/pricing-estimate (BE shape)', () => {
  it('is not swallowed by GET /api/services/:id', async () => {
    const { status, payload } = await call('GET', '/api/services/pricing-estimate?serviceId=svc-1')
    expect(status).toBe(200)
    expect(payload.data).toMatchObject({ serviceId: 'svc-1', servicePrice: 1_500_000, totalPrice: 1_500_000 })
    expect(payload.data.additionalRequirements).toEqual([])
  })

  it('adds the AI add-on to the total', async () => {
    const { payload } = await call('GET', '/api/services/pricing-estimate?serviceId=svc-1&aiImageAnalysis=true')
    expect(payload.data.additionalRequirements[0]).toMatchObject({ type: 'AI_IMAGE_ANALYSIS', additionalPrice: 500_000 })
    expect(payload.data.totalPrice).toBe(2_000_000)
  })

  it('requires serviceId', async () => {
    expect((await call('GET', '/api/services/pricing-estimate')).status).toBe(400)
  })
})

describe('reference lists', () => {
  it('filters service deliverables by service', async () => {
    const { payload } = await call('GET', '/api/service-deliverables?serviceId=svc-2')
    expect(payload.data.map((d: any) => d.deliverableTypeId)).toEqual(['dt-progress', 'dt-photo', 'dt-video'])
  })

  it('lists requirement suggestions and category services', async () => {
    expect((await call('GET', '/api/services/requirement-suggestions?serviceId=svc-1')).payload.data).toHaveLength(1)
    expect((await call('GET', '/api/category-services')).payload.data[0]).toHaveProperty('name')
  })
})

describe('/api/zones', () => {
  it('returns a monitoring zone and a restricted zone with closed rings', async () => {
    const { payload } = await call('GET', '/api/zones')
    expect(payload.data.map((z: any) => z.restricted)).toEqual([false, true])
    const ring = payload.data[0].coordinates
    expect(ring[0]).toEqual(ring[ring.length - 1])
  })
})

describe('POST /api/orders (BE shape)', () => {
  const valid = {
    title: 'Đơn thử',
    serviceId: 'svc-1',
    latitude: 10.6,
    longitude: 106.7,
    coverageArea: { type: 'Polygon', coordinates: [] },
    preferredDateFrom: '2026-10-01',
    preferredDateTo: '2026-10-02',
    preferredTimeId: 'pt-1',
    deliverables: [{ deliverableTypeId: 'dt-photo', requirement: {} }],
  }

  it('creates a PENDING order', async () => {
    const { status, payload } = await call('POST', '/api/orders', valid)
    expect(status).toBe(201)
    expect(payload.data).toMatchObject({ title: 'Đơn thử', orderStatus: 'PENDING' })
    expect(payload.data.id).toBeTruthy()
  })

  it('reports every missing required field', async () => {
    const { status, payload } = await call('POST', '/api/orders', { title: 'x' })
    expect(status).toBe(400)
    expect(Object.keys(payload.errors)).toEqual(expect.arrayContaining(['serviceId', 'coverageArea', 'deliverables']))
  })
})

describe('consultations', () => {
  it('starts a session, replies and recommends a service', async () => {
    const started = await call('POST', '/api/customer/consultations')
    const id = started.payload.data.id
    const reply = await call('POST', `/api/customer/consultations/${id}/messages`, {
      message: 'Giám sát Tiến độ Xây dựng',
      requestContext: serviceCatalogContext,
    })
    expect(reply.payload.data).toMatchObject({ recommendedServiceId: 'svc-2', status: 'READY_FOR_CONFIRMATION' })
    expect((await call('GET', `/api/customer/consultations/${id}`)).status).toBe(200)
  })

  it('recommends construction monitoring for construction intent', async () => {
    const started = await call('POST', '/api/customer/consultations')
    const id = started.payload.data.id
    const reply = await call('POST', `/api/customer/consultations/${id}/messages`, {
      message: 'Tôi muốn giám sát công trình',
      requestContext: serviceCatalogContext,
    })

    expect(reply.payload.data).toMatchObject({
      recommendedServiceId: 'svc-2',
      recommendedServiceName: 'Giám sát Tiến độ Xây dựng',
      status: 'READY_FOR_CONFIRMATION',
    })
    expect(reply.payload.data.messages.at(-1).message).toContain(
      'Giám sát Tiến độ Xây dựng',
    )
  })

  it('recommends dam monitoring only for dam and reservoir intent', async () => {
    const started = await call('POST', '/api/customer/consultations')
    const id = started.payload.data.id
    const reply = await call('POST', `/api/customer/consultations/${id}/messages`, {
      message: 'Cần kiểm tra thân đập, hồ chứa và cửa xả lũ',
      requestContext: serviceCatalogContext,
    })

    expect(reply.payload.data).toMatchObject({
      recommendedServiceId: 'svc-5',
      recommendedServiceName: 'Giám sát Đập nước / Hồ chứa',
      status: 'READY_FOR_CONFIRMATION',
    })
  })

  it('uses previous context when a follow-up only says progress', async () => {
    const started = await call('POST', '/api/customer/consultations')
    const id = started.payload.data.id
    await call('POST', `/api/customer/consultations/${id}/messages`, {
      message: 'Tôi muốn giám sát công trình',
      requestContext: constructionContext,
    })
    const reply = await call('POST', `/api/customer/consultations/${id}/messages`, {
      message: 'kiểm tra là tiến độ',
      requestContext: constructionContext,
    })

    expect(reply.payload.data).toMatchObject({
      recommendedServiceId: 'svc-2',
      recommendedServiceName: 'Giám sát Tiến độ Xây dựng',
      status: 'READY_FOR_CONFIRMATION',
    })
    expect(reply.payload.data.messages.at(-1).message).toContain(
      'Giám sát Tiến độ Xây dựng',
    )
  })

  it('asks a deeper question instead of recommending for unclear input', async () => {
    const started = await call('POST', '/api/customer/consultations')
    const id = started.payload.data.id
    const reply = await call('POST', `/api/customer/consultations/${id}/messages`, {
      message: 'gggg',
    })

    expect(reply.payload.data.status).toBe('ACTIVE')
    expect(reply.payload.data.recommendedServiceId).toBeUndefined()
    expect(reply.payload.data.messages.at(-1).message).toContain(
      'Mình chưa đủ thông tin',
    )
  })

  it('404s for an unknown session', async () => {
    expect((await call('GET', '/api/customer/consultations/nope')).status).toBe(404)
  })
})
