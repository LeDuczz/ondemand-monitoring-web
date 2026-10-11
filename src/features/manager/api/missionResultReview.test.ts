import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  resetHttpTransport,
  setHttpTransport,
} from '../../../shared/api/httpClient'
import { missionsApi } from './missionsApi'

afterEach(resetHttpTransport)
describe('MissionResult review API', () => {
  it('rejects with note only, never client-supplied actor identity', async () => {
    const transport = vi
      .fn()
      .mockResolvedValue(
        Response.json({
          success: true,
          data: { id: 'r', approvalStatus: 'REJECTED' },
        }),
      )
    setHttpTransport(transport)
    expect(
      (await missionsApi.rejectMissionResult('r', '  Kiểm tra lại  '))
        .approvalStatus,
    ).toBe('REJECTED')
    expect(transport.mock.calls[0][0]).toContain(
      '/api/manager/mission-results/r/reject',
    )
    expect(JSON.parse(transport.mock.calls[0][1].body)).toEqual({
      note: 'Kiểm tra lại',
    })
  })
})
