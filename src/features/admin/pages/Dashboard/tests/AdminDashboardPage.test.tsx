import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

import {
  resetHttpTransport,
  setHttpTransport,
} from '../../../../../shared/api/httpClient'
import { resetMockDb } from '../../../../../mocks/db'
import { mockFetch } from '../../../../../mocks'
import '../../../../../mocks/index'
import { setLanguage } from '../../../../../shared/i18n'
import { BE_USER_ROLES } from '../../../api/adminUsersApi'
import { AdminDashboardPage } from '../AdminDashboardPage'

const urls: string[] = []

beforeEach(() => {
  resetMockDb()
  urls.length = 0
  setHttpTransport((i, init) => {
    urls.push(String(i))
    return mockFetch(i, init)
  })
})
afterEach(() => {
  resetMockDb()
  resetHttpTransport()
  act(() => setLanguage('vi'))
})

describe('AdminDashboardPage', () => {
  it('renders title and switches language', async () => {
    render(<AdminDashboardPage />)
    expect(screen.getByText('Tổng quan hệ thống')).toBeTruthy()
    act(() => setLanguage('en'))
    expect(screen.getByText('System overview')).toBeTruthy()
  })

  it('loads account stats from /api/admin/users with size=1 filters', async () => {
    render(<AdminDashboardPage />)
    for (const role of BE_USER_ROLES) {
      await waitFor(() =>
        expect(screen.getByTestId(`dash-role-${role}`).textContent).toMatch(
          /^\d+$/,
        ),
      )
    }
    const users = urls.filter((u) => u.includes('/api/admin/users'))
    expect(users.every((u) => u.includes('size=1'))).toBe(true)
    expect(users.some((u) => u.includes('active=true'))).toBe(true)
    expect(users.some((u) => u.includes('active=false'))).toBe(true)
    expect(users.length).toBe(3 + BE_USER_ROLES.length)
  })

  it('marks mock-backed sections with the sample data badge', async () => {
    render(<AdminDashboardPage />)
    await screen.findByText('Tài khoản mới nhất')
    expect(screen.getAllByText('Dữ liệu mẫu').length).toBeGreaterThan(0)
    expect(screen.getByText('Tổng tài khoản')).toBeTruthy()
  })

  it('shows an error with retry when stats fail', async () => {
    setHttpTransport(async () => new Response('{}', { status: 500 }))
    render(<AdminDashboardPage />)
    await screen.findByText('Không tải được thống kê tài khoản')
  })
})
