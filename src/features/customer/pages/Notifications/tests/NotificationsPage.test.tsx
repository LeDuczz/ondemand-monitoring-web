import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import { resetMockDb } from '../../../../../mocks/db'
import '../../../../../mocks/index'
import { setLanguage } from '../../../../../shared/i18n'
import { customerMediaApi } from '../../../api/customerMediaApi'
import { NotificationsPage } from '../NotificationsPage'

beforeEach(() => resetMockDb())
afterEach(() => {
  resetMockDb()
  vi.restoreAllMocks()
})

describe('NotificationsPage', () => {
  it('renders the Vietnamese title', async () => {
    render(<NotificationsPage />)
    expect(await screen.findByText('Thông báo')).toBeInTheDocument()
  })

  it('renders the English title when language is switched', async () => {
    render(<NotificationsPage />)
    await screen.findByText('Thông báo')
    act(() => setLanguage('en'))
    expect(await screen.findByText('Notifications')).toBeInTheDocument()
  })

  it('lists the BE media notifications with a mission code and a link to the file', async () => {
    const spy = vi.spyOn(customerMediaApi, 'listNotifications')
    render(<NotificationsPage />)
    await waitFor(() => expect(screen.getAllByText('Có kết quả mới sẵn sàng').length).toBeGreaterThan(0))
    expect(spy).toHaveBeenCalled()
    const first = screen.getAllByRole('link', { name: 'Xem kết quả' })[0]
    expect(first.getAttribute('href')).toMatch(/^#portal\/customer\/media\/med-/)
    expect(await screen.findAllByText(/MSN-2609-0131-1/)).not.toHaveLength(0)
  })

  it('pages after 20 notifications', async () => {
    const many = Array.from({ length: 25 }, (_, i) => ({
      notificationId: `n${i}`,
      mediaId: `m${i}`,
      missionId: 'ms',
      eventType: 'CUSTOMER_MEDIA_AVAILABLE',
      createdAt: new Date(2026, 8, 1, 0, i).toISOString(),
    }))
    vi.spyOn(customerMediaApi, 'listNotifications').mockResolvedValue(many)
    render(<NotificationsPage />)
    await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(20))
    fireEvent.click(screen.getByRole('button', { name: 'Trang sau' }))
    await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(5))
  })

  it('shows a generic entry for an unknown event type', async () => {
    vi.spyOn(customerMediaApi, 'listNotifications').mockResolvedValue([
      { notificationId: 'n', mediaId: 'm', missionId: 'ms', eventType: 'SOMETHING_NEW', createdAt: '2026-09-01T00:00:00Z' },
    ])
    render(<NotificationsPage />)
    expect(await screen.findByText('Thông báo: SOMETHING_NEW')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Xem kết quả' })).not.toBeInTheDocument()
  })

  it('shows the empty state', async () => {
    vi.spyOn(customerMediaApi, 'listNotifications').mockResolvedValue([])
    render(<NotificationsPage />)
    expect(await screen.findByText('Chưa có thông báo')).toBeInTheDocument()
  })

  it('shows an error with retry and recovers', async () => {
    vi.spyOn(customerMediaApi, 'listNotifications').mockRejectedValueOnce(new Error('boom'))
    render(<NotificationsPage />)
    expect(await screen.findByText('Không tải được thông báo')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }))
    await waitFor(() => expect(screen.getAllByRole('listitem').length).toBeGreaterThan(0))
  })
})
