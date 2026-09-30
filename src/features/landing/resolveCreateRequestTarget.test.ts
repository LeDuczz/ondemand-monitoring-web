import { describe, expect, it } from 'vitest'

import { resolveCreateRequestTarget } from './resolveCreateRequestTarget'
import type { UserProfile } from '../auth/types'

const userWith = (role: UserProfile['role']): UserProfile => ({
  id: '1',
  fullName: 'Test User',
  email: 'test@example.com',
  emailVerified: true,
  role,
  isActive: true,
})

describe('resolveCreateRequestTarget', () => {
  it('sends a guest (no session) to registration', () => {
    expect(resolveCreateRequestTarget(undefined)).toBe('#auth/register')
  })

  it('sends a CUSTOMER straight to the create-request screen', () => {
    expect(resolveCreateRequestTarget(userWith('CUSTOMER'))).toBe(
      '#portal/customer/request',
    )
  })

  it('sends a STAFF user to their own role home, not the request form', () => {
    expect(resolveCreateRequestTarget(userWith('STAFF'))).toBe('#portal/staff')
  })

  it('sends a DRONE_OPERATOR user to their own role home', () => {
    expect(resolveCreateRequestTarget(userWith('DRONE_OPERATOR'))).toBe(
      '#portal/drone-operator',
    )
  })

  it('sends a SYSTEM_OPERATOR user to their own role home', () => {
    expect(resolveCreateRequestTarget(userWith('SYSTEM_OPERATOR'))).toBe(
      '#portal/system-operator',
    )
  })

  it('sends an ADMIN user to their own role home', () => {
    expect(resolveCreateRequestTarget(userWith('ADMIN'))).toBe('#portal/admin')
  })
})
