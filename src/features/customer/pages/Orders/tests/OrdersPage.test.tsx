import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'

import { resetMockDb } from '../../../../../mocks/db'
import '../../../../../mocks/index'
import { setLanguage } from '../../../../../shared/i18n'
import { customerApi } from '../../../api/customerApi'
import type { OrderCreateResponse } from '../../../api/orderApi'
import { OrdersPage } from '../OrdersPage'

beforeEach(() => resetMockDb())
afterEach(() => {
  resetMockDb()
  vi.restoreAllMocks()
})

const makeOrder = (n: number): OrderCreateResponse => ({
  id: `ord-${n}`,
  customerId: 'c',
  title: `Order number ${n}`,
  orderStatus: 'PENDING',
  createdAt: `2026-09-${String(n).padStart(2, '0')}T00:00:00Z`,
})

const rowsOf = () => within(screen.getByRole('table')).getAllByRole('row').slice(1)

describe('OrdersPage', () => {
  it('renders the Vietnamese title and BE orders from /api/orders/mine', async () => {
    render(<OrdersPage />)
    expect(screen.getByText('Đơn của tôi')).toBeInTheDocument()
    expect(await screen.findByText('Kiểm tra tiến độ nhà xưởng KCN Hiệp Phước')).toBeInTheDocument()
    expect(rowsOf()).toHaveLength(9)
  })

  it('renders the English title when language is switched', async () => {
    render(<OrdersPage />)
    await screen.findByRole('table')
    act(() => setLanguage('en'))
    expect(screen.getByText('My orders')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Completed' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Preferred schedule' })).toBeInTheDocument()
  })

  it('shows the status with OrderStatusBadge', async () => {
    render(<OrdersPage />)
    await screen.findByRole('table')
    expect(within(screen.getByRole('table')).getByText('Bị từ chối')).toBeInTheDocument()
  })

  it('sends the status filter to the BE', async () => {
    const spy = vi.spyOn(customerApi, 'listMyOrders')
    render(<OrdersPage />)
    await screen.findByRole('table')
    fireEvent.click(screen.getByRole('button', { name: 'Hoàn thành' }))
    await waitFor(() => expect(rowsOf()).toHaveLength(1))
    expect(spy).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'COMPLETED' }))
    expect(screen.getByRole('button', { name: 'Hoàn thành' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('searches client-side and shows a filtered empty state that can be cleared', async () => {
    render(<OrdersPage />)
    await screen.findByRole('table')
    const search = screen.getByRole('searchbox', { name: 'Tìm đơn hàng' })
    fireEvent.change(search, { target: { value: 'cát lái' } })
    expect(rowsOf()).toHaveLength(1)
    fireEvent.change(search, { target: { value: 'không có đơn nào như vậy' } })
    expect(screen.getByText('Không có đơn nào khớp bộ lọc hiện tại.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Xoá bộ lọc' }))
    expect(await screen.findAllByRole('row')).toHaveLength(10)
  })

  it('pages client-side, 10 orders per page', async () => {
    vi.spyOn(customerApi, 'listMyOrders').mockResolvedValue(
      Array.from({ length: 25 }, (_, i) => makeOrder(i + 1)),
    )
    render(<OrdersPage />)
    await screen.findByRole('table')
    expect(rowsOf()).toHaveLength(10)
    expect(screen.getByText('Trang 1 / 3')).toBeInTheDocument()
    expect(screen.getByText('Tổng 25 đơn')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Sau' }))
    fireEvent.click(screen.getByRole('button', { name: 'Sau' }))
    expect(screen.getByText('Trang 3 / 3')).toBeInTheDocument()
    expect(rowsOf()).toHaveLength(5)
    expect(screen.getByRole('button', { name: 'Sau' })).toBeDisabled()
  })

  it('shows the empty state with a create link when there are no orders', async () => {
    vi.spyOn(customerApi, 'listMyOrders').mockResolvedValue([])
    render(<OrdersPage />)
    expect(await screen.findByText('Bạn chưa gửi yêu cầu giám sát nào.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Tạo yêu cầu giám sát' })).toHaveAttribute(
      'href',
      '#portal/customer/orders/new',
    )
  })

  it('shows an error with retry and recovers', async () => {
    vi.spyOn(customerApi, 'listMyOrders').mockRejectedValueOnce(new Error('boom'))
    render(<OrdersPage />)
    expect(await screen.findByText('Không tải được danh sách đơn')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }))
    expect(await screen.findByRole('table')).toBeInTheDocument()
  })
})
