import { act } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ApiError } from '../../../shared/api/httpClient'
import { setLanguage } from '../../../shared/i18n'
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
  preferredDateFrom: '2026-09-24T07:00:00+07:00',
  preferredDateTo: '2026-09-26T11:00:00+07:00',
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
  it('shows the customer window but leaves the flight schedule for staff to choose', async () => {
    vi.spyOn(ordersApi, 'getOrderForMission').mockResolvedValue(brief)
    render(
      <CreateMissionPage orderId="ord-2609-0153" now={new Date(2026, 8, 19)} />,
    )
    expect(screen.getByText('Đang tải…')).toBeInTheDocument()
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: 'Tạo nhiệm vụ' }),
      ).toBeInTheDocument(),
    )
    expect(screen.getByText('Khoảng thời gian khách yêu cầu')).toBeTruthy()
    expect(screen.getByText('24/09 · Sáng')).toBeTruthy()
    expect(screen.getByText('Dự báo thời tiết theo khoảng khách yêu cầu')).toBeTruthy()
    await waitFor(() => expect(screen.getByText('24/09/2026')).toBeInTheDocument())
    expect(screen.getByText('25/09/2026')).toBeInTheDocument()
    expect(screen.getByText('26/09/2026')).toBeInTheDocument()
    const startInput = screen.getByLabelText('Giờ cất cánh') as HTMLInputElement
    const endInput = screen.getByLabelText(
      'Giờ kết thúc dự kiến',
    ) as HTMLInputElement
    expect(startInput.value).toBe('')
    expect(endInput.value).toBe('')
    expect(screen.queryByText('Flight plan')).not.toBeInTheDocument()
    expect(screen.queryByText('Kiểu bay')).not.toBeInTheDocument()
    expect(screen.queryByRole('img', { name: 'Xem trước đường bay' })).toBeNull()
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
        screen.getByText('Không tải được đơn để tạo nhiệm vụ'),
      ).toBeInTheDocument(),
    )
    expect(screen.getByText(/mission-brief · 409/)).toBeInTheDocument()
  })

  it('submits and navigates to the dispatch page on success', async () => {
    vi.spyOn(ordersApi, 'getOrderForMission').mockResolvedValue(brief)
    vi.spyOn(missionsApi, 'createMission').mockResolvedValue(createdMission)
    render(
      <CreateMissionPage orderId="ord-2609-0153" now={new Date(2026, 8, 19)} />,
    )
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: 'Tạo nhiệm vụ' }),
      ).toBeInTheDocument(),
    )
    fireEvent.change(screen.getByLabelText('Giờ cất cánh'), {
      target: { value: '2026-09-24T08:00' },
    })
    fireEvent.change(screen.getByLabelText('Giờ kết thúc dự kiến'), {
      target: { value: '2026-09-24T09:30' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Tạo nhiệm vụ' }))
    await waitFor(() =>
      expect(missionsApi.createMission).toHaveBeenCalledWith(
        'ord-2609-0153',
        expect.objectContaining({
          scheduledStart: '2026-09-24T01:00:00.000Z',
          scheduledEnd: '2026-09-24T02:30:00.000Z',
        }),
      ),
    )
    await waitFor(() =>
      expect(window.location.hash).toBe(
        '#portal/staff/missions/msn-2609-0153-1/setup',
      ),
    )
  })

  it('blocks submit when the finish time is before takeoff time', async () => {
    vi.spyOn(ordersApi, 'getOrderForMission').mockResolvedValue(brief)
    vi.spyOn(missionsApi, 'createMission').mockResolvedValue(createdMission)
    render(
      <CreateMissionPage orderId="ord-2609-0153" now={new Date(2026, 8, 19)} />,
    )
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: 'Tạo nhiệm vụ' }),
      ).toBeInTheDocument(),
    )
    fireEvent.change(screen.getByLabelText('Giờ cất cánh'), {
      target: { value: '2026-09-11T18:58' },
    })
    fireEvent.change(screen.getByLabelText('Giờ kết thúc dự kiến'), {
      target: { value: '2026-09-10T15:58' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Tạo nhiệm vụ' }))
    expect(
      await screen.findByText('Giờ kết thúc phải sau giờ cất cánh.'),
    ).toBeInTheDocument()
    expect(missionsApi.createMission).not.toHaveBeenCalled()
  })

  it('422 shows the design error copy with retry', async () => {
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
        screen.getByRole('heading', { name: 'Tạo nhiệm vụ' }),
      ).toBeInTheDocument(),
    )
    fireEvent.change(screen.getByLabelText('Giờ cất cánh'), {
      target: { value: '2026-09-24T08:00' },
    })
    fireEvent.change(screen.getByLabelText('Giờ kết thúc dự kiến'), {
      target: { value: '2026-09-24T09:30' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Tạo nhiệm vụ' }))
    await waitFor(() =>
      expect(
        screen.getByText('Không tạo được kế hoạch bay'),
      ).toBeInTheDocument(),
    )
    expect(
      screen.queryByRole('button', { name: 'Nhập waypoint thủ công' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Thêm waypoint' }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Thử lại' }),
    ).toBeInTheDocument()
  })

  it('renders English title and labels when language is switched', async () => {
    vi.spyOn(ordersApi, 'getOrderForMission').mockResolvedValue(brief)
    render(
      <CreateMissionPage orderId="ord-2609-0153" now={new Date(2026, 8, 19)} />,
    )
    act(() => setLanguage('en'))
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: 'Create mission' }),
      ).toBeInTheDocument(),
    )
    expect(screen.getByText('Customer requested window')).toBeTruthy()
    expect(
      screen.getByText('Actual flight schedule selected by staff'),
    ).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Create mission' })).toBeTruthy()
  })
})
