import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

import { resetMockDb } from '../../../../../mocks/db'
import '../../../../../mocks/index'
import { setLanguage } from '../../../../../shared/i18n'
import { customerApi } from '../../../api/customerApi'
import { LiveHubPage } from '../LiveHubPage'

beforeEach(() => resetMockDb())
afterEach(() => {
  resetMockDb()
  vi.restoreAllMocks()
})

describe('LiveHubPage', () => {
  it('renders the Vietnamese title', async () => {
    render(<LiveHubPage />)
    expect(await screen.findByText('Xem trực tiếp')).toBeInTheDocument()
  })

  it('renders the English title when language is switched', async () => {
    render(<LiveHubPage />)
    await screen.findByText('Xem trực tiếp')
    act(() => setLanguage('en'))
    expect(await screen.findByText('Live view')).toBeInTheDocument()
  })

  it('derives the active orders from /api/orders/mine?status=IN_PROGRESS', async () => {
    const list = vi.spyOn(customerApi, 'listMyOrders')
    render(<LiveHubPage />)
    const link = await screen.findByRole('link', { name: 'Vào xem trực tiếp →' })
    expect(link).toHaveAttribute('href', '#portal/customer/orders/cus-ord-001/live')
    expect(list).toHaveBeenCalledWith({ status: 'IN_PROGRESS', signal: expect.any(AbortSignal) })
    expect(screen.getAllByRole('listitem')).toHaveLength(1)
  })

  it('shows the empty state when nothing is in progress', async () => {
    vi.spyOn(customerApi, 'listMyOrders').mockResolvedValue([])
    render(<LiveHubPage />)
    expect(await screen.findByText('Không có phiên trực tiếp')).toBeInTheDocument()
  })

  it('shows an error with retry and recovers', async () => {
    vi.spyOn(customerApi, 'listMyOrders').mockRejectedValueOnce(new Error('boom'))
    render(<LiveHubPage />)
    expect(await screen.findByText('Không tải được danh sách đơn đang thực hiện')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }))
    expect(await screen.findByRole('link', { name: 'Vào xem trực tiếp →' })).toBeInTheDocument()
  })
})
