import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  resetHttpTransport,
  setHttpTransport,
} from '../../../shared/api/httpClient'
import { customerMediaApi } from './customerMediaApi'
import { customerMissionHistoryApi } from './customerMissionHistoryApi'

afterEach(resetHttpTransport)
describe('customer history API', () => {
  it('uses customer-scoped paths, pagination, and abort signals', async () => {
    const transport = vi.fn<
      (url: string, options?: RequestInit) => Promise<Response>
    >(
      async () =>
        new Response(JSON.stringify({ success: true, data: { items: [] } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
    )
    setHttpTransport(transport)
    const signal = new AbortController().signal
    await customerMissionHistoryApi.list(2, signal)
    expect(String(transport.mock.calls[0]?.[0])).toContain(
      '/api/customer/mission-history?page=2&size=20',
    )
    expect(transport.mock.calls[0]?.[1]?.signal).toBe(signal)
    await customerMediaApi.getMissionMedia('mission/a', 'media/b', signal)
    expect(String(transport.mock.calls[1]?.[0])).toContain(
      '/api/customer/missions/mission%2Fa/media/media%2Fb',
    )
  })
})
