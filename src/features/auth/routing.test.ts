import { describe, expect, it } from 'vitest'

import { getRoleHomePath, getRoleHomeUrl } from './routing'

describe('auth routing', () => {
  it('maps a customer to the customer portal', () => {
    expect(getRoleHomePath('CUSTOMER')).toBe('#portal/customer')
  })

  it('builds an absolute customer portal URL for OAuth callbacks', () => {
    expect(getRoleHomeUrl('CUSTOMER', 'http://localhost:5173')).toBe(
      'http://localhost:5173/#portal/customer',
    )
  })

  it('falls back to login when the social response has no role', () => {
    expect(getRoleHomeUrl(undefined, 'http://localhost:5173/')).toBe(
      'http://localhost:5173/#auth/login',
    )
  })
})
