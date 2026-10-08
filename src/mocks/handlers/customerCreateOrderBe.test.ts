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
  '- svc-construction | Giám sát công trình | Chụp ảnh và video hiện trạng công trình, hỗ trợ theo dõi và đối chiếu tiến độ thi công.',
  '- svc-factory | Kiểm tra nhà xưởng | Quan sát mái, bề mặt và các khu vực khó tiếp cận của nhà xưởng.',
  '- svc-area | Giám sát khu vực | Chụp ảnh và video tổng quan một khu vực theo vị trí và phạm vi giám sát.',
  '- svc-forest | Giám sát rừng | Chụp ảnh và video khu vực rừng, ghi nhận hiện trạng và dấu hiệu bất thường.',
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
    const { status, payload } = await call('GET', '/api/services/pricing-estimate?serviceId=svc-construction')
    expect(status).toBe(200)
    expect(payload.data).toMatchObject({ serviceId: 'svc-construction', servicePrice: 3_500_000, totalPrice: 3_500_000 })
    expect(payload.data.additionalRequirements).toEqual([])
  })

  it('adds the AI add-on to the total', async () => {
    const { payload } = await call('GET', '/api/services/pricing-estimate?serviceId=svc-construction&aiImageAnalysis=true')
    expect(payload.data.additionalRequirements[0]).toMatchObject({ type: 'AI_IMAGE_ANALYSIS', additionalPrice: 500_000 })
    expect(payload.data.totalPrice).toBe(4_000_000)
  })

  it('requires serviceId', async () => {
    expect((await call('GET', '/api/services/pricing-estimate')).status).toBe(400)
  })
})

describe('reference lists', () => {
  it('filters service deliverables by service', async () => {
    const { payload } = await call('GET', '/api/service-deliverables?serviceId=svc-construction')
    expect(payload.data.map((d: any) => d.deliverableTypeId)).toEqual(['dt-photo', 'dt-video', 'dt-report'])
  })

  it('lists requirement suggestions and category services', async () => {
    expect((await call('GET', '/api/services/requirement-suggestions?serviceId=svc-construction')).payload.data).toHaveLength(1)
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
    serviceId: 'svc-construction',
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
      message: 'Giám sát công trình',
      requestContext: serviceCatalogContext,
    })
    expect(reply.payload.data).toMatchObject({ recommendedServiceId: 'svc-construction', status: 'READY_FOR_CONFIRMATION' })
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
      recommendedServiceId: 'svc-construction',
      recommendedServiceName: 'Giám sát công trình',
      status: 'READY_FOR_CONFIRMATION',
    })
    expect(reply.payload.data.messages.at(-1).message).toContain(
      'Giám sát công trình',
    )
  })

  it('recommends forest monitoring for forest intent', async () => {
    const started = await call('POST', '/api/customer/consultations')
    const id = started.payload.data.id
    const reply = await call('POST', `/api/customer/consultations/${id}/messages`, {
      message: 'Cần giám sát rừng và khu vực cây xanh bất thường',
      requestContext: serviceCatalogContext,
    })

    expect(reply.payload.data).toMatchObject({
      recommendedServiceId: 'svc-forest',
      recommendedServiceName: 'Giám sát rừng',
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
      recommendedServiceId: 'svc-construction',
      recommendedServiceName: 'Giám sát công trình',
      status: 'READY_FOR_CONFIRMATION',
    })
    expect(reply.payload.data.messages.at(-1).message).toContain(
      'Giám sát công trình',
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
