import { describe, expect, it } from 'vitest'

import {
  accountsSubtitle,
  computeAccountCounts,
  filterAccounts,
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

describe('filterAccounts', () => {
  const items = [
    acc({ id: '1', fullName: 'Nguyễn Minh Khoa', email: 'khoa@odms.vn', role: 'CUSTOMER', status: 'ACTIVE' }),
    acc({ id: '2', fullName: 'Trần Thị Thu Hà', email: 'ha@odms.vn', role: 'STAFF', status: 'INACTIVE' }),
    acc({ id: '3', fullName: 'Hoàng Đức Thắng', email: 'thang@odms.vn', role: 'DRONE_OPERATOR', status: 'PENDING' }),
  ]

  it('returns all items with no filters', () => {
    expect(filterAccounts(items, {})).toHaveLength(3)
  })

  it('filters by role', () => {
    expect(filterAccounts(items, { role: 'STAFF' }).map((a) => a.id)).toEqual(['2'])
  })

  it('filters by status', () => {
    expect(filterAccounts(items, { status: 'PENDING' }).map((a) => a.id)).toEqual(['3'])
  })

  it('filters by query matching name or email, case-insensitive', () => {
    expect(filterAccounts(items, { query: 'thu hà' }).map((a) => a.id)).toEqual(['2'])
    expect(filterAccounts(items, { query: 'THANG@ODMS' }).map((a) => a.id)).toEqual(['3'])
  })

  it('combines filters', () => {
    expect(
      filterAccounts(items, { role: 'CUSTOMER', status: 'ACTIVE', query: 'khoa' }).map(
        (a) => a.id,
      ),
    ).toEqual(['1'])
  })
})
