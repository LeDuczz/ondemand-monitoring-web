import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

import { setLanguage } from '../../../../../shared/i18n'
import { supportApi, type SupportTicketDto } from '../../../api/supportApi'
import { CustomerTicketsListPage } from '../CustomerTicketsListPage'

const ticket = (n: number, status: SupportTicketDto['status']): SupportTicketDto => ({
  id: `tk-${n}`,
  ticketCode: `TK-000${n}`,
  customerId: 'u',
  customerName: 'C',
  category: 'ORDERS',
  subject: `Subject ${n}`,
  priority: 'NORMAL',
  status,
  openedAt: '2026-09-20T08:00:00Z',
})

beforeEach(() => {
  vi.spyOn(supportApi, 'listTickets').mockResolvedValue([ticket(1, 'OPEN'), ticket(2, 'RESOLVED')])
})
afterEach(() => {
  vi.restoreAllMocks()
  setLanguage('vi')
})

describe('CustomerTicketsListPage', () => {
  it('lists tickets with translated status badges and links to the detail page', async () => {
    render(<CustomerTicketsListPage />)
    expect(await screen.findByText('Subject 1')).toBeInTheDocument()
    expect(screen.getAllByText('Mới mở').length).toBeGreaterThan(0)
    expect(screen.getByRole('link', { name: 'Subject 2' })).toHaveAttribute('href', '#help/tickets/tk-2')
  })

  it('shows English status labels and filters by status', async () => {
    render(<CustomerTicketsListPage />)
    await screen.findByText('Subject 1')
    act(() => setLanguage('en'))
    expect(screen.getByText('My support tickets')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Filter by status'), { target: { value: 'RESOLVED' } })
    expect(screen.queryByText('Subject 1')).not.toBeInTheDocument()
    expect(screen.getByText('Subject 2')).toBeInTheDocument()
  })

  it('shows the empty state and the error state', async () => {
    vi.spyOn(supportApi, 'listTickets').mockResolvedValue([])
    const { unmount } = render(<CustomerTicketsListPage />)
    expect(await screen.findByText('Bạn chưa có yêu cầu hỗ trợ nào')).toBeInTheDocument()
    unmount()

    vi.spyOn(supportApi, 'listTickets').mockRejectedValue(new Error('boom'))
    render(<CustomerTicketsListPage />)
    expect(await screen.findByText('Không tải được danh sách yêu cầu hỗ trợ')).toBeInTheDocument()
  })
})
