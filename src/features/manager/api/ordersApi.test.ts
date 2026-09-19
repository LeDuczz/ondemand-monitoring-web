import { afterEach, describe, expect, it } from 'vitest'

import {
  resetHttpTransport,
  setHttpTransport,
} from '../../../shared/api/httpClient'
import { resetMockDb } from '../../../mocks/db'
import { mockFetch } from '../../../mocks'
import { ordersApi } from './ordersApi'

describe('ordersApi (mock mode)', () => {
  afterEach(() => {
    resetHttpTransport()
    resetMockDb()
  })

  it('getQueue resolves the 6 PENDING rows', async () => {
    setHttpTransport(mockFetch)
    const rows = await ordersApi.getQueue()
    expect(rows).toHaveLength(6)
    expect(rows[0].code).toBe('ORD-2609-0157')
  })
})
