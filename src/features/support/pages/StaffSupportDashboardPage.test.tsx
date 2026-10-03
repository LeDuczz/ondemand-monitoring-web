import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { authSession } from '../../auth/api/authApi'
import { supportApi } from '../api/supportApi'
import { StaffSupportDashboardPage } from './StaffSupportDashboardPage'

afterEach(() => vi.restoreAllMocks())

describe('staff support permissions', () => {
  it('loads assigned tickets without calling manager-only endpoints', async () => {
    vi.spyOn(authSession, 'getUser').mockReturnValue({
      id: 'u1',
      email: 'staff@example.com',
      fullName: 'Staff',
      role: 'STAFF',
    })
    const tickets = vi.spyOn(supportApi, 'listTickets').mockResolvedValue([])
    const agents = vi.spyOn(supportApi, 'getStaffAgents').mockResolvedValue([])
    const analytics = vi.spyOn(supportApi, 'getAnalytics')
    render(<StaffSupportDashboardPage />)
    await waitFor(() => expect(tickets).toHaveBeenCalled())
    expect(agents).not.toHaveBeenCalled()
    expect(analytics).not.toHaveBeenCalled()
  })

  it('shows a ticket API failure instead of disguising it as an empty queue', async () => {
    vi.spyOn(authSession, 'getUser').mockReturnValue({
      id: 'u1',
      email: 'staff@example.com',
      fullName: 'Staff',
      role: 'STAFF',
    })
    vi.spyOn(supportApi, 'listTickets').mockRejectedValue(
      new Error('Ticket access denied'),
    )
    render(<StaffSupportDashboardPage />)
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Ticket access denied',
    )
    expect(screen.getByRole('button', { name: 'Thử lại' })).toBeTruthy()
  })
})
