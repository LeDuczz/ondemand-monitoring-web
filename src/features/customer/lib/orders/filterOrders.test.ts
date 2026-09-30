import { describe, expect, it } from 'vitest'

import { paginate, searchOrders, sortNewestFirst } from './filterOrders'
import type { OrderRow } from './types'

const row = (over: Partial<OrderRow>): OrderRow => ({
  id: 'id',
  code: 'CODE',
  title: 'Title',
  address: null,
  dateFrom: null,
  dateTo: null,
  timeId: null,
  timeName: null,
  serviceId: null,
  serviceName: null,
  status: 'PENDING',
  radiusM: null,
  createdAt: null,
  ...over,
})

describe('sortNewestFirst', () => {
  it('sorts by createdAt descending without mutating the input', () => {
    const input = [
      row({ id: 'a', createdAt: '2026-09-01T00:00:00Z' }),
      row({ id: 'b', createdAt: '2026-09-03T00:00:00Z' }),
    ]
    expect(sortNewestFirst(input).map((r) => r.id)).toEqual(['b', 'a'])
    expect(input[0].id).toBe('a')
  })
})

describe('searchOrders', () => {
  const rows = [
    row({ id: '1', title: 'Roof check', address: 'Long Hau' }),
    row({ id: '2', title: 'Crop survey', serviceName: 'Agriculture' }),
  ]
  it('returns everything for an empty query', () => {
    expect(searchOrders(rows, '  ')).toHaveLength(2)
  })
  it('matches title, address and service case-insensitively', () => {
    expect(searchOrders(rows, 'ROOF').map((r) => r.id)).toEqual(['1'])
    expect(searchOrders(rows, 'long hau').map((r) => r.id)).toEqual(['1'])
    expect(searchOrders(rows, 'agri').map((r) => r.id)).toEqual(['2'])
    expect(searchOrders(rows, 'nothing')).toEqual([])
  })
})

describe('paginate', () => {
  const items = Array.from({ length: 25 }, (_, i) => i)
  it('slices a page and reports totals', () => {
    expect(paginate(items, 1, 10)).toMatchObject({ page: 1, totalPages: 3, totalItems: 25 })
    expect(paginate(items, 2, 10).items).toEqual([20, 21, 22, 23, 24])
  })
  it('clamps out-of-range pages and handles empty lists', () => {
    expect(paginate(items, 99, 10).page).toBe(2)
    expect(paginate(items, -3, 10).page).toBe(0)
    expect(paginate([], 4, 10)).toMatchObject({ items: [], page: 0, totalPages: 1, totalItems: 0 })
  })
})
