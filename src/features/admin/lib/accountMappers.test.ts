import { describe, expect, it } from 'vitest'

import {
  mapAccountStatus,
  mapUserDetail,
  mapUserSummary,
} from './accountMappers'

const summary = {
  id: 'u1',
  fullName: 'An Nguyen',
  email: 'an@x.vn',
  role: 'MANAGER' as const,
  active: true,
  emailVerified: false,
  createdAt: '2026-01-01T00:00:00Z',
}

describe('accountMappers', () => {
  it('maps active flag to status', () => {
    expect(mapAccountStatus(true)).toBe('ACTIVE')
    expect(mapAccountStatus(false)).toBe('INACTIVE')
  })

  it('maps summary with empty values for missing BE fields', () => {
    expect(mapUserSummary(summary)).toEqual({
      id: 'u1',
      fullName: 'An Nguyen',
      email: 'an@x.vn',
      role: 'MANAGER',
      status: 'ACTIVE',
      emailVerified: false,
      createdAt: '2026-01-01T00:00:00Z',
      lastLoginAt: null,
    })
  })

  it('keeps lastLoginAt and inactive status', () => {
    const item = mapUserSummary({
      ...summary,
      active: false,
      lastLoginAt: '2026-02-01T00:00:00Z',
    })
    expect(item.status).toBe('INACTIVE')
    expect(item.lastLoginAt).toBe('2026-02-01T00:00:00Z')
  })

  it('maps detail with providers and null avatar', () => {
    const d = mapUserDetail({ ...summary, linkedProviders: ['GOOGLE'] })
    expect(d.linkedProviders).toEqual(['GOOGLE'])
    expect(d.avatarUrl).toBeNull()
    expect(mapUserDetail(summary).linkedProviders).toEqual([])
  })
})
