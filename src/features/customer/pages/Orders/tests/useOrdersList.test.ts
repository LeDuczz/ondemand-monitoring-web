import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'

import { customerApi } from '../../../api/customerApi'
import type { OrderCreateResponse } from '../../../api/orderApi'
import { useOrdersList } from '../hooks/useOrdersList'

const orders: OrderCreateResponse[] = Array.from({ length: 12 }, (_, i) => ({
  id: `o-${i}`,
  customerId: 'c',
  title: i === 3 ? 'Special roof' : `Order ${i}`,
  orderStatus: 'PENDING',
  createdAt: `2026-09-${String(i + 1).padStart(2, '0')}T00:00:00Z`,
}))

beforeEach(() => {
  vi.spyOn(customerApi, 'listMyOrders').mockResolvedValue(orders)
})
afterEach(() => vi.restoreAllMocks())

describe('useOrdersList', () => {
  it('maps, sorts newest first and pages the BE list', async () => {
    const { result } = renderHook(() => useOrdersList())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.view.items).toHaveLength(10)
    expect(result.current.view.items[0].id).toBe('o-11')
    expect(result.current.view.totalPages).toBe(2)
  })

  it('resets to the first page when the search changes', async () => {
    const { result } = renderHook(() => useOrdersList())
    await waitFor(() => expect(result.current.loading).toBe(false))
    act(() => result.current.setPage(1))
    expect(result.current.view.page).toBe(1)
    act(() => result.current.setQuery('roof'))
    expect(result.current.view.page).toBe(0)
    expect(result.current.view.items.map((r) => r.id)).toEqual(['o-3'])
    expect(result.current.filtered).toBe(true)
  })

  it('refetches with the status and clears filters', async () => {
    const { result } = renderHook(() => useOrdersList())
    await waitFor(() => expect(result.current.loading).toBe(false))
    act(() => result.current.setStatus('APPROVED'))
    await waitFor(() =>
      expect(customerApi.listMyOrders).toHaveBeenLastCalledWith(
        expect.objectContaining({ status: 'APPROVED' }),
      ),
    )
    act(() => result.current.clear())
    expect(result.current.status).toBe('')
    expect(result.current.query).toBe('')
    expect(result.current.filtered).toBe(false)
  })
})
