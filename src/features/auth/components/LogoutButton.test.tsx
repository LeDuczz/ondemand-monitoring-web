import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { authApi, authSession } from '../api/authApi'
import { LogoutButton } from './LogoutButton'

afterEach(() => {
  authSession.clear()
  window.location.hash = ''
  vi.restoreAllMocks()
})

describe('LogoutButton', () => {
  it('renders the Vietnamese label and triggers logout on click', async () => {
    localStorage.setItem('fieldwise.accessToken', 'token-123')
    vi.spyOn(authApi, 'logout').mockResolvedValue(undefined)

    render(<LogoutButton />)
    const button = screen.getByRole('button', { name: 'Đăng xuất' })

    await act(async () => {
      fireEvent.click(button)
    })

    expect(authApi.logout).toHaveBeenCalledWith('token-123')
    expect(window.location.hash).toBe('#auth/login')
  })
})
