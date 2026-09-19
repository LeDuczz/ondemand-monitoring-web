import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ApiError } from '../../../shared/api/httpClient'
import { ordersApi } from '../api/ordersApi'
import { missionsApi } from '../api/missionsApi'
import type { Mission } from '../types/missions'
import type { OrderMissionBrief } from '../types/orders'
import { CreateMissionPage } from './CreateMissionPage'

const brief: OrderMissionBrief = {
  id: 'ord-2609-0153',
  code: 'ORD-2609-0153',
  serviceName: 'Kiểm tra nhiệt mái nhà xưởng KCN Hiệp Phước',
  customerFullName: 'Trần Thị Thu Hà',
  preferredDate: '24/09',
  preferredTimeName: 'Sáng',
  addressText: 'KCN Hiệp Phước, Nhà Bè',
  center: { lat: 10.6402, lon: 106.74 },
  radiusM: 300,
  nearestBase: 'Trạm Nhà Bè',
  mediaRequirements: [
    { label: 'VIDEO × 1 · 240 giây' },
    { label: 'PHOTO × 30 · 640×512' },
  ],
}

const createdMission: Mission = {
  id: 'msn-2609-0153-1',
  orderId: 'ord-2609-0153',
  orderCode: 'ORD-2609-0153',
  missionCode: 'MSN-2609-0153-1',
  status: 'CREATED',
  attemptNumber: 1,
  droneId: null,
  operatorId: null,
  droneAssignmentId: null,
  operatorAssignmentId: null,
  scheduledStartAt: '2026-09-24T08:00:00+07:00',
  scheduledEndAt: '2026-09-24T09:30:00+07:00',
  addressText: brief.addressText,
  centerLat: 10.6402,
  centerLon: 106.74,
  radiusM: 300,
  requiredSensor: 'THERMAL',
  nearestBase: 'Trạm Nhà Bè',
  mediaRequirements: [],
  flightPlan: {
    planType: 'ORBIT',
    centerLat: 10.6402,
    centerLon: 106.74,
    radiusM: 300,
    altitudeM: 60,
    speedMs: 8,
    estimatedDurationSec: 600,
    generatedBy: 'SYSTEM',
  },
  waypoints: [],
}

afterEach(() => {
  vi.restoreAllMocks()
  window.location.hash = ''
})

describe('CreateMissionPage', () => {
  it('shows a loading skeleton, then prefills the schedule from Sáng', async () => {
    vi.spyOn(ordersApi, 'getOrderForMission').mockResolvedValue(brief)
    render(
      <CreateMissionPage orderId="ord-2609-0153" now={new Date(2026, 8, 19)} />,
    )
    expect(screen.getByText('Đang tải…')).toBeInTheDocument()
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: 'Tạo mission' }),
      ).toBeInTheDocument(),
    )
    const startInput = screen.getByLabelText('Bắt đầu') as HTMLInputElement
    expect(startInput.value).toBe('2026-09-24T07:00')
  })

  it('shows the error state with a mono debug line when the brief fails to load', async () => {
    vi.spyOn(ordersApi, 'getOrderForMission').mockRejectedValue(
      new ApiError('Đơn chưa được duyệt', {
        status: 409,
        method: 'GET',
        path: '/api/orders/ord-2609-0153/mission-brief',
      }),
    )
    render(<CreateMissionPage orderId="ord-2609-0153" />)
    await waitFor(() =>
      expect(
        screen.getByText('Không tải được đơn để tạo mission'),
      ).toBeInTheDocument(),
    )
    expect(screen.getByText(/mission-brief · 409/)).toBeInTheDocument()
  })

  it('changing plan type regenerates the waypoint table', async () => {
    vi.spyOn(ordersApi, 'getOrderForMission').mockResolvedValue(brief)
    render(
      <CreateMissionPage orderId="ord-2609-0153" now={new Date(2026, 8, 19)} />,
    )
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: 'Tạo mission' }),
      ).toBeInTheDocument(),
    )
    const orbitCount = screen.getAllByRole('row').length
    fireEvent.click(screen.getByRole('button', { name: 'POINT' }))
    await waitFor(() => {
      const pointCount = screen.getAllByRole('row').length
      expect(pointCount).not.toBe(orbitCount)
    })
  })

  it('shows an altitude warning above the service ceiling', async () => {
    vi.spyOn(ordersApi, 'getOrderForMission').mockResolvedValue(brief)
    render(
      <CreateMissionPage orderId="ord-2609-0153" now={new Date(2026, 8, 19)} />,
    )
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: 'Tạo mission' }),
      ).toBeInTheDocument(),
    )
    const altInput = screen.getByLabelText('Độ cao (m)')
    fireEvent.change(altInput, { target: { value: '130' } })
    await waitFor(() =>
      expect(
        screen.getByText(/vượt trần khai thác thông thường/),
      ).toBeInTheDocument(),
    )
  })

  it('submits and navigates to the dispatch page on success', async () => {
    vi.spyOn(ordersApi, 'getOrderForMission').mockResolvedValue(brief)
    vi.spyOn(missionsApi, 'createMission').mockResolvedValue(createdMission)
    render(
      <CreateMissionPage orderId="ord-2609-0153" now={new Date(2026, 8, 19)} />,
    )
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: 'Tạo mission' }),
      ).toBeInTheDocument(),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Tạo mission' }))
    await waitFor(() =>
      expect(window.location.hash).toBe(
        '#portal/staff/missions/msn-2609-0153-1/dispatch',
      ),
    )
  })

  it('422 shows the design error copy with retry + manual waypoint entry', async () => {
    vi.spyOn(ordersApi, 'getOrderForMission').mockResolvedValue(brief)
    vi.spyOn(missionsApi, 'createMission').mockRejectedValue(
      new ApiError('Dịch vụ tạo đường bay báo lỗi cho khu vực này.', {
        status: 422,
        code: 'FLIGHT_PLAN_GENERATION_FAILED',
        method: 'POST',
        path: '/api/orders/ord-2609-0153/missions',
      }),
    )
    render(
      <CreateMissionPage orderId="ord-2609-0153" now={new Date(2026, 8, 19)} />,
    )
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: 'Tạo mission' }),
      ).toBeInTheDocument(),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Tạo mission' }))
    await waitFor(() =>
      expect(
        screen.getByText('Không sinh được flight plan'),
      ).toBeInTheDocument(),
    )
    expect(
      screen.getByRole('button', { name: 'Nhập waypoint thủ công' }),
    ).toBeInTheDocument()

    fireEvent.click(
      screen.getByRole('button', { name: 'Nhập waypoint thủ công' }),
    )
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: 'Tạo mission' }),
      ).toBeInTheDocument(),
    )
    expect(
      screen.getByRole('button', { name: 'Thêm waypoint' }),
    ).toBeInTheDocument()
  })
})
