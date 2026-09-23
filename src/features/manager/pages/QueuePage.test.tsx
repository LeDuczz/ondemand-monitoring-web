import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ApiError } from '../../../shared/api/httpClient'
import { ordersApi } from '../api/ordersApi'
import type { OrderQueueItem } from '../types/orders'
import { QueuePage } from './QueuePage'

const rows: OrderQueueItem[] = [
  {
    id: 'ord-1',
    code: 'ORD-2609-0157',
    customer: {
      fullName: 'Lê Quốc Bảo',
      companyName: 'Công ty CP Logistics Cát Lái',
    },
    serviceName: 'Tuần tra an ninh khu vực',
    preferredDate: '25/09',
    preferredTimeName: 'Chiều',
    submittedAt: '2026-09-19T08:32:00+07:00',
    aiVerdict: 'FEASIBLE',
    blockerCount: 0,
    warningCount: 0,
  },
  {
    id: 'ord-2',
    code: 'ORD-2609-0160',
    customer: {
      fullName: 'Võ Thanh Tùng',
      companyName: 'Công ty CP Đầu tư Sóng Thần',
    },
    serviceName: 'Tuần tra an ninh khu vực',
    preferredDate: '24/09',
    preferredTimeName: 'Sáng',
    submittedAt: '2026-09-18T19:32:00+07:00',
    aiVerdict: 'RISKY',
    blockerCount: 0,
    warningCount: 2,
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
    expect(screen.getByText('ORD-2609-0157')).toBeInTheDocument()
    expect(screen.getByText('ORD-2609-0160')).toBeInTheDocument()
    expect(
      screen.getByText('2 đơn đang chờ · 0 đơn quá 24 giờ'),
    ).toBeInTheDocument()
  })

  it('filters by verdict chip', async () => {
    vi.spyOn(ordersApi, 'getQueue').mockResolvedValue(rows)
    render(<QueuePage now={FIXED_NOW} />)
    await waitFor(() => screen.getByText('Hàng đợi duyệt đơn'))

    fireEvent.click(screen.getByRole('button', { name: /RISKY/ }))
    expect(screen.queryByText('ORD-2609-0157')).not.toBeInTheDocument()
    expect(screen.getByText('ORD-2609-0160')).toBeInTheDocument()
  })

  it('changes sort mode via the select', async () => {
    vi.spyOn(ordersApi, 'getQueue').mockResolvedValue(rows)
    render(<QueuePage now={FIXED_NOW} />)
    await waitFor(() => screen.getByText('Hàng đợi duyệt đơn'))

    fireEvent.change(screen.getByLabelText('Sắp xếp'), {
      target: { value: 'longestWait' },
    })
    const codes = screen.getAllByText(/ORD-2609-/).map((el) => el.textContent)
    expect(codes[0]).toBe('ORD-2609-0160')
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
    await waitFor(() => screen.getByText('ORD-2609-0157'))
    expect(getQueue).toHaveBeenCalledTimes(2)
  })

  it('shows the empty state when there are no PENDING orders', async () => {
    vi.spyOn(ordersApi, 'getQueue').mockResolvedValue([])
    render(<QueuePage now={FIXED_NOW} />)
    await waitFor(() => screen.getByText('Không còn đơn chờ duyệt'))
  })
})
