import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { authApi, authSession } from './authApi'
import { logout } from './logout'

beforeEach(() => {
  authSession.clear()
  window.location.hash = ''
})

afterEach(() => {
  authSession.clear()
  window.location.hash = ''
  vi.restoreAllMocks()
})

describe('logout', () => {
  it('calls authApi.logout with the stored token, clears the session, and redirects', async () => {
    localStorage.setItem('fieldwise.accessToken', 'token-123')
    localStorage.setItem(
      'fieldwise.user',
      JSON.stringify({
        id: '1',
        fullName: 'A',
        email: 'a@b.com',
        role: 'STAFF',
      }),
    )
    const logoutSpy = vi.spyOn(authApi, 'logout').mockResolvedValue(undefined)

    await logout()

    expect(logoutSpy).toHaveBeenCalledWith('token-123')
    expect(authSession.getAccessToken()).toBeNull()
    expect(authSession.getUser()).toBeUndefined()
    expect(window.location.hash).toBe('#auth/login')
  })

  it('still clears the session and redirects when the API call fails', async () => {
    localStorage.setItem('fieldwise.accessToken', 'token-123')
    vi.spyOn(authApi, 'logout').mockRejectedValue(new Error('network down'))

    await logout()

    expect(authSession.getAccessToken()).toBeNull()
    expect(window.location.hash).toBe('#auth/login')
  })

  it('skips the API call and still redirects when there is no token', async () => {
    const logoutSpy = vi.spyOn(authApi, 'logout')

    await logout()

    expect(logoutSpy).not.toHaveBeenCalled()
    expect(window.location.hash).toBe('#auth/login')
  })
})
