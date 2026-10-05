import { afterEach, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Router } from '../../../../app/router'
import { authSession } from '../../../auth/api/authApi'
import { checklistsApi } from '../../api/checklistsApi'

afterEach(() => {
  vi.restoreAllMocks()
  window.location.hash = ''
})
it.each(['#portal/admin/checklists', '#portal/admin/services/s/checklists'])(
  'denies Customer at %s before fetching Admin APIs',
  (hash) => {
    vi.spyOn(authSession, 'getUser').mockReturnValue({
      id: 'customer',
      email: 'customer@example.test',
      fullName: 'Customer',
      role: 'CUSTOMER',
    })
    vi.spyOn(authSession, 'getAccessToken').mockReturnValue('test-only-token')
    const list = vi.spyOn(checklistsApi, 'list')
    const template = vi.spyOn(checklistsApi, 'template')
    window.location.hash = hash
    render(<Router />)
    expect(
      screen.queryByRole('heading', { name: 'Danh mục checklist' }),
    ).toBeNull()
    expect(
      screen.queryByRole('heading', { name: 'Checklist dịch vụ' }),
    ).toBeNull()
    expect(list).not.toHaveBeenCalled()
    expect(template).not.toHaveBeenCalled()
    expect(window.location.hash).toBe('#portal/customer')
  },
)
