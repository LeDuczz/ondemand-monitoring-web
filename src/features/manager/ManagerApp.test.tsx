import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { authSession } from '../auth/api/authApi'
import { managerApi } from './api/dashboardApi'
import { ordersApi } from './api/ordersApi'
import { ManagerApp } from './ManagerApp'
import type { ManagerDashboardResponse } from './types/dashboard'

const sampleData: ManagerDashboardResponse = {
  kpis: {
    pendingOrders: { count: 6, detail: '2 quá 24h' },
    missionsToday: { count: 5, detail: '3 đã xong' },
    missionsInFlight: { count: 1, detail: '' },
    dronesReady: { ready: 5, total: 9, detail: '1 bảo trì' },
    actionItems: { count: 4, detail: '2 upload · 2 lỗi media' },
  },
  missionStatusByDay: [],
  droneStatusBreakdown: [],
  actionItems: [
    {
      id: 'ai-4',
      type: 'MAINTENANCE_TICKET',
      ticketId: 'MT-1',
      code: 'MT-1',
      title: 'DRN-07: rung bất thường',
      subtitle: 'CRITICAL',
      openedAtIso: '2026-09-13T14:32:00+07:00',
    },
  ],
  flyingMission: null,
  navCounts: {
    pendingOrders: 6,
    openMaintenanceTickets: 3,
    mediaNeedsAction: 6,
  },
}

beforeEach(() => {
  localStorage.setItem('fieldwise.accessToken', 'mock-staff-token')
  localStorage.setItem(
    'fieldwise.user',
    JSON.stringify({
      id: '1',
      fullName: 'Lê Thị Thanh Hằng',
      email: 'hang.le@odms.vn',
      role: 'STAFF',
    }),
  )
  window.location.hash = ''
})

afterEach(() => {
  authSession.clear()
  window.location.hash = ''
  vi.restoreAllMocks()
})

describe('ManagerApp', () => {
  it('renders the Dashboard (MNG-01) for #portal/staff', async () => {
    vi.spyOn(managerApi, 'getDashboard').mockResolvedValue(sampleData)
    window.location.hash = '#portal/staff'
    render(<ManagerApp />)

    await waitFor(() =>
      expect(screen.getByText('Dashboard điều hành')).toBeInTheDocument(),
    )
  })

  it('feeds the nav badges from navCounts, not from actionItems', async () => {
    vi.spyOn(managerApi, 'getDashboard').mockResolvedValue(sampleData)
    window.location.hash = '#portal/staff'
    render(<ManagerApp />)

    await waitFor(() => {
      // sampleData.actionItems only has 1 MAINTENANCE_TICKET row, but the
      // badge must reflect navCounts.openMaintenanceTickets (3), not that
      // undercounted list length.
      expect(screen.getByRole('link', { name: /Bảo trì/ })).toHaveTextContent(
        '3',
      )
      expect(screen.getByRole('link', { name: /Duyệt đơn/ })).toHaveTextContent(
        '6',
      )
      expect(
        screen.getByRole('link', { name: /Media và giao kết quả/ }),
      ).toHaveTextContent('6')
    })
  })

  it('shows the "under construction" placeholder for screens not built yet', async () => {
    vi.spyOn(managerApi, 'getDashboard').mockResolvedValue(sampleData)
    window.location.hash = '#portal/staff/schedule'
    render(<ManagerApp />)

    await waitFor(() =>
      expect(
        screen.getByText('Màn hình đang được xây dựng'),
      ).toBeInTheDocument(),
    )
    expect(screen.getByText(/MNG-06/)).toBeInTheDocument()
  })

  it('renders the real QueuePage (MNG-02) for #portal/staff/orders', async () => {
    vi.spyOn(managerApi, 'getDashboard').mockResolvedValue(sampleData)
    vi.spyOn(ordersApi, 'getQueue').mockResolvedValue([])
    window.location.hash = '#portal/staff/orders'
    render(<ManagerApp />)

    await waitFor(() =>
      expect(screen.getByText('Hàng đợi duyệt đơn')).toBeInTheDocument(),
    )
  })

  it('shows a not-found state with a link back to Dashboard for unknown routes', async () => {
    vi.spyOn(managerApi, 'getDashboard').mockResolvedValue(sampleData)
    window.location.hash = '#portal/staff/unknown-thing'
    render(<ManagerApp />)

    await waitFor(() =>
      expect(screen.getByText('Không tìm thấy màn hình')).toBeInTheDocument(),
    )
    expect(screen.getByRole('link', { name: 'Về Dashboard' })).toHaveAttribute(
      'href',
      '#portal/staff',
    )
  })
})
