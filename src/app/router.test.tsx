import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { authSession } from '../features/auth/api/authApi'
import { managerApi } from '../features/manager/api/dashboardApi'
import type { ManagerDashboardResponse } from '../features/manager/types/dashboard'
import { Router } from './router'

// jsdom does not fire `hashchange` automatically when `location.hash` is set
// programmatically (unlike a real browser), so tests that simulate the user
// navigating (back/forward, a pasted link) set the hash and dispatch the
// event by hand.
function navigateHash(hash: string) {
  window.location.hash = hash
  fireEvent(window, new HashChangeEvent('hashchange'))
}

beforeEach(() => {
  window.location.hash = ''
})

afterEach(() => {
  window.location.hash = ''
})

describe('Router - auth hash sync (regression)', () => {
  it('shows the login form for #auth/login and the register form for #auth/register', () => {
    window.location.hash = '#auth/login'
    render(<Router />)
    expect(
      screen.getByRole('heading', { name: 'Đăng nhập' }),
    ).toBeInTheDocument()

    navigateHash('#auth/register')
    expect(
      screen.getByRole('heading', { name: 'Tạo tài khoản khách hàng' }),
    ).toBeInTheDocument()

    navigateHash('#auth/login')
    expect(
      screen.getByRole('heading', { name: 'Đăng nhập' }),
    ).toBeInTheDocument()
  })

  it('keeps switching correctly across repeated register <-> login navigation', () => {
    window.location.hash = '#auth/register'
    render(<Router />)
    expect(
      screen.getByRole('heading', { name: 'Tạo tài khoản khách hàng' }),
    ).toBeInTheDocument()

    navigateHash('#auth/login')
    expect(
      screen.getByRole('heading', { name: 'Đăng nhập' }),
    ).toBeInTheDocument()

    navigateHash('#auth/register')
    expect(
      screen.getByRole('heading', { name: 'Tạo tài khoản khách hàng' }),
    ).toBeInTheDocument()
  })

  it('updates the hash when using the in-page mode switch buttons', () => {
    window.location.hash = '#auth/login'
    render(<Router />)

    fireEvent.click(screen.getByRole('button', { name: 'Đăng ký' }))
    expect(window.location.hash).toBe('#auth/register')
    expect(
      screen.getByRole('heading', { name: 'Tạo tài khoản khách hàng' }),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }))
    expect(window.location.hash).toBe('#auth/login')
    expect(
      screen.getByRole('heading', { name: 'Đăng nhập' }),
    ).toBeInTheDocument()
  })
})

describe('Router - manager routes (#portal/staff*)', () => {
  const sampleDashboard: ManagerDashboardResponse = {
    kpis: {
      pendingOrders: { count: 6, detail: '2 quá 24h' },
      missionsToday: { count: 5, detail: '3 đã xong' },
      missionsInFlight: { count: 1, detail: '' },
      dronesReady: { ready: 5, total: 9, detail: '1 bảo trì' },
      actionItems: { count: 4, detail: '2 upload · 2 lỗi media' },
    },
    missionStatusByDay: [],
    droneStatusBreakdown: [],
    actionItems: [],
    flyingMission: null,
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
  })

  afterEach(() => {
    authSession.clear()
    vi.restoreAllMocks()
  })

  it('routes a STAFF user hitting #portal/staff to the Manager dashboard', async () => {
    vi.spyOn(managerApi, 'getDashboard').mockResolvedValue(sampleDashboard)
    window.location.hash = '#portal/staff'
    render(<Router />)

    await waitFor(() =>
      expect(screen.getByText('Dashboard điều hành')).toBeInTheDocument(),
    )
  })

  it('routes nested #portal/staff/... hashes to the Manager area too', async () => {
    vi.spyOn(managerApi, 'getDashboard').mockResolvedValue(sampleDashboard)
    window.location.hash = '#portal/staff/orders'
    render(<Router />)

    await waitFor(() =>
      expect(
        screen.getByText('Màn hình đang được xây dựng'),
      ).toBeInTheDocument(),
    )
  })
})
