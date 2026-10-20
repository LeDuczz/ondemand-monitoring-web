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
import { RolesPage } from '../RolesPage'

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

describe('RolesPage', () => {
  it('renders title and switches language', () => {
    render(<RolesPage />)
    expect(screen.getByText('Vai trò')).toBeTruthy()
    act(() => setLanguage('en'))
    expect(screen.getByText('Roles')).toBeTruthy()
  })

  it('shows skeletons then one count per role from size=1 queries', async () => {
    render(<RolesPage />)
    expect(screen.getByTestId('role-skeleton-ADMIN')).toBeTruthy()
    for (const role of BE_USER_ROLES) {
      const el = await screen.findByTestId(`role-count-${role}`)
      expect(Number(el.textContent)).toBeGreaterThanOrEqual(0)
      expect(
        urls.some((u) => u.includes(`role=${role}`) && u.includes('size=1')),
      ).toBe(true)
    }
  })

  it('shows an error with retry when a count fails', async () => {
    setHttpTransport(async () => new Response('{}', { status: 500 }))
    render(<RolesPage />)
    await waitFor(() =>
      expect(screen.getAllByText('Không tải được số liệu').length).toBe(
        BE_USER_ROLES.length,
      ),
    )
  })

  it('has no role CRUD actions', () => {
    render(<RolesPage />)
    expect(screen.queryByText('+ Tạo vai trò')).toBeNull()
  })
})
