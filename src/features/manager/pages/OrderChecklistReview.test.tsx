import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  resetHttpTransport,
  setHttpTransport,
  type HttpTransport,
} from '../../../shared/api/httpClient'
import { setLanguage } from '../../../shared/i18n'
import { ordersApi } from '../api/ordersApi'
import type { OrderChecklistSnapshot } from '../types/orders'
import { OrderReviewPage } from './OrderReviewPage'

const snapshot: OrderChecklistSnapshot[] = [
  {
    id: 'edited',
    sourceChecklistId: 'C1',
    sourceType: 'SERVICE_TEMPLATE',
    content: 'Check emergency exits on floors 1-3',
    displayOrder: 2,
  },
  {
    id: 'kept',
    sourceChecklistId: 'C2',
    sourceType: 'SERVICE_TEMPLATE',
    content: 'Check PPE',
    displayOrder: 0,
  },
  {
    id: 'custom',
    sourceChecklistId: null,
    sourceType: 'CUSTOMER_CUSTOM',
    content: 'Check temporary barriers',
    displayOrder: 1,
  },
]
const backendOrder = {
  id: 'order-history',
  orderStatus: 'PENDING',
  customerId: 'customer',
  customerName: 'Customer',
  serviceId: 'service',
  serviceName: 'Monitoring',
  description: '',
  address: null,
  deliverables: [],
  latitude: null,
  longitude: null,
  preferredDateFrom: '2026-10-05',
  preferredDateTo: '2026-10-05',
  preferredTimeName: 'Morning',
  createdAt: '2026-10-04T00:00:00Z',
  checklistSnapshotAt: '2026-10-04T00:00:00Z',
  checklistItems: snapshot,
}
const response = (data: unknown) =>
  new Response(JSON.stringify({ success: true, data }), { status: 200 })

function serveOrder(data: unknown = backendOrder) {
  const transport = vi.fn<HttpTransport>(async (url, init) => {
    const path = new URL(url, 'http://localhost').pathname
    if (
      path === '/api/orders/order-history' &&
      (!init?.method || init.method === 'GET')
    )
      return response(data)
    if (path === '/api/orders/order-history/approve')
      return response({ ...backendOrder, orderStatus: 'APPROVED' })
    if (path === '/api/orders/order-history/approval') return response(null)
    return response(null)
  })
  setHttpTransport(transport)
  return transport
}

beforeEach(() => setLanguage('vi'))
afterEach(() => {
  resetHttpTransport()
  vi.restoreAllMocks()
  window.location.hash = ''
})

describe('Manager historical checklist review through Order API', () => {
  it.each(['vi', 'en'] as const)(
    'renders mixed historical content/provenance read only in %s, without fetching the catalog',
    async (language) => {
      setLanguage(language)
      const transport = serveOrder()
      render(<OrderReviewPage orderId="order-history" />)
      const region = await screen.findByRole('region', {
        name:
          language === 'vi' ? 'Nội dung giám sát' : 'Monitoring requirements',
      })
      expect(
        within(region)
          .getAllByRole('listitem')
          .map((item) => item.querySelector('p')?.textContent),
      ).toEqual([
        'Check PPE',
        'Check temporary barriers',
        'Check emergency exits on floors 1-3',
      ])
      expect(
        within(region).getAllByText(
          language === 'vi' ? 'Nội dung từ dịch vụ' : 'Service requirement',
        ),
      ).toHaveLength(2)
      expect(
        within(region).getByText(
          language === 'vi'
            ? 'Nội dung khách hàng bổ sung'
            : 'Customer-added requirement',
        ),
      ).toBeInTheDocument()
      for (const role of ['button', 'checkbox', 'textbox'])
        expect(within(region).queryByRole(role)).not.toBeInTheDocument()
      expect(within(region).queryByText('C1')).not.toBeInTheDocument()
      expect(
        transport.mock.calls.some(([url]) => url.includes('/api/services/')),
      ).toBe(false)
      expect(snapshot.map((item) => item.id)).toEqual([
        'edited',
        'kept',
        'custom',
      ])
    },
  )

  it('renders a service-only snapshot', async () => {
    serveOrder({
      ...backendOrder,
      checklistItems: snapshot.filter(
        (item) => item.sourceType === 'SERVICE_TEMPLATE',
      ),
    })
    render(<OrderReviewPage orderId="order-history" />)
    const region = await screen.findByRole('region', {
      name: 'Nội dung giám sát',
    })
    expect(within(region).getAllByRole('listitem')).toHaveLength(2)
    expect(
      within(region).queryByText('Nội dung khách hàng bổ sung'),
    ).not.toBeInTheDocument()
  })

  it.each([
    [
      'vi',
      '2026-10-04T00:00:00Z',
      'Khách hàng đã gửi yêu cầu không kèm nội dung giám sát.',
    ],
    ['vi', null, 'Đơn hàng này chưa có bản chốt nội dung giám sát.'],
    [
      'en',
      '2026-10-04T00:00:00Z',
      'The customer submitted this order without monitoring requirements.',
    ],
    [
      'en',
      null,
      'No monitoring requirements snapshot is available for this order.',
    ],
  ] as const)(
    'distinguishes empty/legacy in %s with timestamp %s',
    async (language, timestamp, text) => {
      setLanguage(language)
      serveOrder({
        ...backendOrder,
        checklistItems: [],
        checklistSnapshotAt: timestamp,
      })
      render(<OrderReviewPage orderId="order-history" />)
      expect(await screen.findByText(text)).toBeInTheDocument()
    },
  )

  it('does not show an empty snapshot while Order Detail is loading', async () => {
    let resolve!: (value: Response) => void
    setHttpTransport(async (url) =>
      new URL(url).pathname === '/api/orders/order-history'
        ? new Promise<Response>((done) => {
            resolve = done
          })
        : response(null),
    )
    render(<OrderReviewPage orderId="order-history" />)
    expect(screen.getByText('Đang tải…')).toBeInTheDocument()
    expect(
      screen.queryByRole('region', { name: 'Nội dung giám sát' }),
    ).not.toBeInTheDocument()
    await act(async () => resolve(response(backendOrder)))
    expect(await screen.findByText('Check PPE')).toBeInTheDocument()
  })

  it.each(['http', 'malformed'] as const)(
    'shows Order error, not empty requirements, for %s failure',
    async (failure) => {
      if (failure === 'malformed')
        serveOrder({
          ...backendOrder,
          checklistItems: [{ ...snapshot[0], sourceType: 'UNKNOWN' }],
        })
      else
        setHttpTransport(
          async () =>
            new Response(
              JSON.stringify({ success: false, code: 'SERVER_ERROR' }),
              { status: 500 },
            ),
        )
      render(<OrderReviewPage orderId="order-history" />)
      expect(
        await screen.findByText('Không tải được hồ sơ đơn'),
      ).toBeInTheDocument()
      expect(
        screen.queryByRole('region', { name: 'Nội dung giám sát' }),
      ).not.toBeInTheDocument()
      expect(
        screen.queryByRole('button', { name: 'Duyệt & lên lịch' }),
      ).not.toBeInTheDocument()
    },
  )

  it('does not expose the legacy approve-and-schedule bypass', async () => {
    const transport = serveOrder()
    render(<OrderReviewPage orderId="order-history" />)
    await screen.findByText('Check PPE')
    expect(
      screen.queryByRole('button', { name: 'Duyệt & lên lịch' }),
    ).not.toBeInTheDocument()
    const writes = transport.mock.calls.filter(
      ([, init]) => init?.method === 'POST',
    )
    expect(writes).toHaveLength(0)
  })

  it('requires rejection reason and posts only the existing Order decision', async () => {
    const transport = serveOrder()
    render(<OrderReviewPage orderId="order-history" />)
    await screen.findByText('Check PPE')
    fireEvent.click(screen.getByRole('button', { name: 'Từ chối' }))
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận từ chối' }))
    expect(screen.getByText('Lý do là bắt buộc')).toBeInTheDocument()
    expect(
      transport.mock.calls.some(([, init]) => init?.method === 'POST'),
    ).toBe(false)
    fireEvent.change(
      screen.getByPlaceholderText('Khách hàng sẽ nhìn thấy nội dung này'),
      { target: { value: 'Requirements outside service scope' } },
    )
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận từ chối' }))
    await waitFor(() =>
      expect(window.location.hash).toBe('#portal/manager/orders'),
    )
    const writes = transport.mock.calls.filter(
      ([, init]) => init?.method === 'POST',
    )
    expect(writes).toHaveLength(1)
    expect(JSON.parse(String(writes[0][1]?.body))).toEqual({
      decision: 'REJECTED',
      reason: 'Requirements outside service scope',
    })
  })

  it('preserves snapshot fields on legacy Manager projections too', async () => {
    serveOrder({
      ...backendOrder,
      customer: { fullName: 'Legacy mock customer' },
      status: 'PENDING',
    })
    const detail = await ordersApi.getOrder('order-history')
    expect(detail.checklistItems).toEqual(snapshot)
    expect(detail.checklistSnapshotAt).toBe(backendOrder.checklistSnapshotAt)
  })

  it.each([
    { checklistItems: 'invalid' },
    { checklistItems: null },
    { checklistItems: undefined },
    { checklistSnapshotAt: 'invalid-date' },
    { checklistItems: [{ ...snapshot[0], displayOrder: -1 }] },
    { checklistItems: [{ ...snapshot[0], content: '' }] },
    { checklistItems: [{ ...snapshot[0], sourceChecklistId: null }] },
    { checklistItems: [{ ...snapshot[2], sourceChecklistId: 'fake-source' }] },
    { checklistItems: [snapshot[0], snapshot[0]] },
  ])(
    'rejects malformed snapshot instead of fabricating empty history: %j',
    async (invalid) => {
      serveOrder({ ...backendOrder, ...invalid })
      await expect(ordersApi.getOrder('order-history')).rejects.toMatchObject({
        code: 'INVALID_ORDER_CHECKLIST_SNAPSHOT',
      })
    },
  )
})
