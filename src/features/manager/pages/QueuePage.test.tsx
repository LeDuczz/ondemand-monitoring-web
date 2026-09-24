import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ApiError } from '../../../shared/api/httpClient'
import { ordersApi } from '../api/ordersApi'
import type { OrderCreateResponse } from '../types/orders'
import { QueuePage } from './QueuePage'

const rows: OrderCreateResponse[] = [
  {
    id: 'ord-2609-0157',
    customerId: 'cust-le-quoc-bao',
    customerName: 'Lê Quốc Bảo',
    title: 'Tuần tra bãi container ngoài giờ',
    serviceId: 'svc-tuan-tra-an-ninh-khu-vuc',
    serviceName: 'Tuần tra an ninh khu vực',
    description: 'Tuần tra an ninh khu vực cảng Cát Lái',
    address: 'Cảng Cát Lái, P. Cát Lái, TP. Thủ Đức',
    longitude: 106.7952,
    latitude: 10.7686,
    coverageArea: null,
    preferredDateFrom: '2026-09-25T13:00:00+07:00',
    preferredDateTo: '2026-09-25T17:00:00+07:00',
    preferredTimeId: 'time-afternoon',
    preferredTimeName: 'Chiều',
    orderStatus: 'PENDING',
    rejectReason: null,
    reviewById: null,
    reviewByName: null,
    reviewAt: null,
    deliverables: [],
    createdAt: '2026-09-19T08:32:00+07:00',
    updatedAt: '2026-09-19T08:32:00+07:00',
  },
  {
    id: 'ord-2609-0160',
    customerId: 'cust-vo-thanh-tung',
    customerName: 'Võ Thanh Tùng',
    title: 'Tuần tra an ninh khu vực',
    serviceId: 'svc-tuan-tra-an-ninh-khu-vuc',
    serviceName: 'Tuần tra an ninh khu vực',
    description: 'Tuần tra an ninh khu vực',
    address: 'Sóng Thần, Dĩ An',
    longitude: 106.75,
    latitude: 10.9,
    coverageArea: null,
    preferredDateFrom: '2026-09-24T07:00:00+07:00',
    preferredDateTo: '2026-09-24T11:00:00+07:00',
    preferredTimeId: 'time-morning',
    preferredTimeName: 'Sáng',
    orderStatus: 'PENDING',
    rejectReason: null,
    reviewById: null,
    reviewByName: null,
    reviewAt: null,
    deliverables: [],
    createdAt: '2026-09-18T19:32:00+07:00',
    updatedAt: '2026-09-18T19:32:00+07:00',
  },
]

const FIXED_NOW = new Date('2026-09-19T14:32:00+07:00')

afterEach(() => {
  vi.restoreAllMocks()
})

describe('QueuePage', () => {
  it('shows loading, then the queue rows', async () => {
    vi.spyOn(ordersApi, 'getQueue').mockResolvedValue(rows)
    render(<QueuePage now={FIXED_NOW} />)

    await waitFor(() => screen.getByText('Hàng đợi duyệt đơn'))
    expect(screen.getByText('ord-2609-0157')).toBeInTheDocument()
    expect(screen.getByText('ord-2609-0160')).toBeInTheDocument()
    expect(
      screen.getByText('2 đơn đang chờ · 0 đơn quá 24 giờ'),
    ).toBeInTheDocument()
  })

  it('changes sort mode via the select', async () => {
    vi.spyOn(ordersApi, 'getQueue').mockResolvedValue(rows)
    render(<QueuePage now={FIXED_NOW} />)
    await waitFor(() => screen.getByText('Hàng đợi duyệt đơn'))

    fireEvent.change(screen.getByLabelText('Sắp xếp'), {
      target: { value: 'longestWait' },
    })
    const codes = screen.getAllByText(/ord-2609-/).map((el) => el.textContent)
    expect(codes[0]).toBe('ord-2609-0160')
  })

  it('shows the error state and retries', async () => {
    const getQueue = vi
      .spyOn(ordersApi, 'getQueue')
      .mockRejectedValueOnce(
        new ApiError('lỗi', { status: 500, method: 'GET', path: '/orders' }),
      )
      .mockResolvedValueOnce(rows)

    render(<QueuePage now={FIXED_NOW} />)
    await waitFor(() => screen.getByText('Không tải được hàng đợi'))
    expect(getQueue).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }))
    await waitFor(() => screen.getByText('ord-2609-0157'))
    expect(getQueue).toHaveBeenCalledTimes(2)
  })

  it('shows the empty state when there are no PENDING orders', async () => {
    vi.spyOn(ordersApi, 'getQueue').mockResolvedValue([])
    render(<QueuePage now={FIXED_NOW} />)
    await waitFor(() => screen.getByText('Không còn đơn chờ duyệt'))
  })
})
