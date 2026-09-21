import { describe, expect, it } from 'vitest'

import {
  accountsSubtitle,
  computeAccountCounts,
  pageRangeLabel,
} from './accountStatus'
import type { AdminAccountItem } from '../types/accounts'

function acc(overrides: Partial<AdminAccountItem>): AdminAccountItem {
  return {
    id: 'a1',
    fullName: 'Nguyen Van A',
    email: 'a@odms.vn',
    role: 'CUSTOMER',
    status: 'ACTIVE',
    emailVerified: true,
    createdAt: '2026-01-01T00:00:00Z',
    lastLoginAt: null,
    ...overrides,
  }
}

describe('computeAccountCounts', () => {
  it('returns zeros for empty list', () => {
    expect(computeAccountCounts([])).toEqual({ total: 0, pilots: 0, locked: 0 })
  })

  it('counts total, pilots and locked accounts', () => {
    const items = [
      acc({ id: '1', role: 'DRONE_OPERATOR', status: 'ACTIVE' }),
      acc({ id: '2', role: 'DRONE_OPERATOR', status: 'INACTIVE' }),
      acc({ id: '3', role: 'CUSTOMER', status: 'INACTIVE' }),
      acc({ id: '4', role: 'ADMIN', status: 'ACTIVE' }),
    ]
    expect(computeAccountCounts(items)).toEqual({ total: 4, pilots: 2, locked: 2 })
  })
})

describe('accountsSubtitle', () => {
  it('formats the summary line', () => {
    expect(accountsSubtitle({ total: 13, pilots: 5, locked: 2 })).toBe(
      '13 tài khoản · 5 phi công · 2 tài khoản bị khoá',
    )
  })
})

describe('pageRangeLabel', () => {
  it('handles empty result set', () => {
    expect(pageRangeLabel(0, 0)).toBe('Hiển thị 0/0')
  })

  it('formats the visible range', () => {
    expect(pageRangeLabel(13, 13)).toBe('Hiển thị 1–13/13')
  })
})
