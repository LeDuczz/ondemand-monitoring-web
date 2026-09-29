import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

import '../../../mocks/index'
import { customerMediaApi } from '../api/customerMediaApi'
import { useNewMediaCount } from './useNewMediaCount'

afterEach(() => vi.restoreAllMocks())

describe('useNewMediaCount', () => {
  it('counts the BE media notifications', async () => {
    const { result } = renderHook(() => useNewMediaCount())
    expect(result.current).toBeUndefined()
    await waitFor(() => expect(result.current).toBeGreaterThan(0))
  })

  it('stays undefined when the request fails', async () => {
    const spy = vi.spyOn(customerMediaApi, 'listNotifications').mockRejectedValue(new Error('boom'))
    const { result } = renderHook(() => useNewMediaCount())
    await waitFor(() => expect(spy).toHaveBeenCalled())
    expect(result.current).toBeUndefined()
  })
})
