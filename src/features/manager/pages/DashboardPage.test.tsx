import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ApiError } from '../../../shared/api/httpClient'
import { managerApi } from '../api/dashboardApi'
import type { ManagerDashboardResponse } from '../types/dashboard'
import { DashboardPage } from './DashboardPage'

const sampleData: ManagerDashboardResponse = {
  kpis: {
    pendingOrders: { count: 6, detail: '2 quá 24h' },
    missionsToday: { count: 5, detail: '3 đã xong' },
    missionsInFlight: { count: 1, detail: '' },
    dronesReady: { ready: 5, total: 9, detail: '1 bảo trì' },
    actionItems: { count: 4, detail: '2 upload · 2 lỗi media' },
  },
  missionStatusByDay: [
    { date: '2026-09-19', completed: 3, inFlight: 1, failed: 0, cancelled: 0 },
  ],
  droneStatusBreakdown: [
    { status: 'AVAILABLE', count: 5 },
    { status: 'RESERVED', count: 1 },
    { status: 'IN_MISSION', count: 1 },
    { status: 'MAINTENANCE', count: 1 },
    { status: 'OUT_OF_SERVICE', count: 1 },
  ],
  actionItems: [
    {
      id: 'ai-1',
      type: 'ORDER_PENDING',
      orderId: 'ORD-1',
      code: 'ORD-1',
      title: 'Tuần tra an ninh bãi container Cát Lái',
      subtitle: 'Lê Quốc Bảo',
      submittedAtIso: '2026-09-18T07:32:00+07:00',
    },
  ],
  flyingMission: {
    missionId: 'MSN-1',
    code: 'MSN-2609-0142-1',
    title: 'Giám sát tiến độ thi công Sala Riverside',
    droneCode: 'DRN-02',
    droneName: 'Hải Âu',
    operatorName: 'Hoàng Đức Thắng',
    batteryPercent: 71,
    startedAtIso: '2026-09-19T13:34:00+07:00',
    plannedDurationMin: 90,
  },
}

const emptyData: ManagerDashboardResponse = {
  kpis: {
    pendingOrders: { count: 0, detail: '' },
    missionsToday: { count: 0, detail: '' },
    missionsInFlight: { count: 0, detail: '' },
    dronesReady: { ready: 0, total: 0, detail: '' },
    actionItems: { count: 0, detail: '' },
  },
  missionStatusByDay: [],
  droneStatusBreakdown: [],
  actionItems: [],
  flyingMission: null,
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('DashboardPage', () => {
  it('shows a loading skeleton, then the KPI numbers once data arrives', async () => {
    vi.spyOn(managerApi, 'getDashboard').mockResolvedValue(sampleData)
    render(<DashboardPage />)

    expect(screen.getByText('Đang tải…')).toBeInTheDocument()

    await waitFor(() =>
      expect(screen.getByText('Dashboard điều hành')).toBeInTheDocument(),
    )

    expect(screen.getByText('6')).toBeInTheDocument()
    expect(screen.getByText('2 quá 24h')).toBeInTheDocument()
    expect(screen.getByText('5/9')).toBeInTheDocument()
    expect(
      screen.getByText('Tuần tra an ninh bãi container Cát Lái'),
    ).toBeInTheDocument()
    expect(screen.getByText('Đang bay')).toBeInTheDocument()
  })

  it('links each KPI card to its related screen', async () => {
    vi.spyOn(managerApi, 'getDashboard').mockResolvedValue(sampleData)
    render(<DashboardPage />)
    await waitFor(() => screen.getByText('Dashboard điều hành'))

    expect(screen.getByRole('link', { name: /Đơn chờ duyệt/ })).toHaveAttribute(
      'href',
      '#portal/staff/orders',
    )
    expect(
      screen.getByRole('link', { name: /Mission hôm nay/ }),
    ).toHaveAttribute('href', '#portal/staff/missions')
    expect(
      screen.getByRole('link', { name: /Mission đang bay/ }),
    ).toHaveAttribute('href', '#portal/staff/live')
    expect(
      screen.getByRole('link', { name: /Drone sẵn sàng/ }),
    ).toHaveAttribute('href', '#portal/staff/drones')
    expect(
      screen.getByRole('link', { name: /Việc cần xử lý/ }),
    ).toHaveAttribute('href', '#portal/staff/media')
  })

  it('shows the error state with the mono debug line and retries on click', async () => {
    const getDashboard = vi
      .spyOn(managerApi, 'getDashboard')
      .mockRejectedValueOnce(
        new ApiError('Đã có lỗi', {
          status: 500,
          method: 'GET',
          path: '/manager/dashboard',
        }),
      )
      .mockResolvedValueOnce(sampleData)

    render(<DashboardPage />)

    await waitFor(() =>
      expect(
        screen.getByText('Không tải được số liệu điều hành'),
      ).toBeInTheDocument(),
    )
    expect(screen.getByText('GET /manager/dashboard · 500')).toBeInTheDocument()
    expect(getDashboard).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }))

    await waitFor(() => screen.getByText('Dashboard điều hành'))
    expect(getDashboard).toHaveBeenCalledTimes(2)
  })

  it('shows the empty-state copy and zeroed KPIs when the API returns zero data', async () => {
    vi.spyOn(managerApi, 'getDashboard').mockResolvedValue(emptyData)
    render(<DashboardPage />)

    await waitFor(() => screen.getByText('Dashboard điều hành'))

    expect(screen.getByText('Không có việc cần xử lý')).toBeInTheDocument()
    expect(
      screen.getByText('Chưa có mission trong 7 ngày qua'),
    ).toBeInTheDocument()
    expect(screen.getByText('0/0')).toBeInTheDocument()
  })
})
