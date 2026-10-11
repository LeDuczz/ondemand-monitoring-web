import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  resetHttpTransport,
  setHttpTransport,
} from '../../../shared/api/httpClient'
import { checklistExecutionApi } from './checklistExecutionApi'

afterEach(resetHttpTransport)
describe('checklist execution API', () => {
  it('reads the backend envelope without substituting current templates', async () => {
    const data = {
      missionId: 'm',
      legacySnapshot: true,
      readyForSubmission: true,
      executions: [],
    }
    const transport = vi
      .fn()
      .mockResolvedValue(Response.json({ success: true, data }))
    setHttpTransport(transport)
    expect(
      await checklistExecutionApi.getMissionChecklistExecutions('m'),
    ).toEqual(data)
    expect(transport.mock.calls[0][0]).toContain(
      '/api/missions/m/checklist-executions',
    )
  })
  it('sends expectedVersion and returns the new version', async () => {
    const transport = vi
      .fn()
      .mockResolvedValue(
        Response.json({ success: true, data: { id: 'e', version: 5 } }),
      )
    setHttpTransport(transport)
    const payload = {
      expectedVersion: 4,
      executionStatus: 'COMPLETED',
      assessmentStatus: 'NOT_ASSESSED',
      observation: null,
      unableToVerifyReason: null,
    } as const
    expect(
      (
        await checklistExecutionApi.updateMissionChecklistExecution(
          'm',
          'e',
          payload,
        )
      ).version,
    ).toBe(5)
    expect(transport.mock.calls[0][1].method).toBe('PATCH')
    expect(JSON.parse(transport.mock.calls[0][1].body)).toEqual(payload)
  })
  it('propagates 409 with code and does not retry', async () => {
    const transport = vi
      .fn()
      .mockResolvedValue(
        Response.json(
          { success: false, code: 'CONCURRENT_UPDATE', message: 'Refresh' },
          { status: 409 },
        ),
      )
    setHttpTransport(transport)
    await expect(
      checklistExecutionApi.updateMissionChecklistExecution('m', 'e', {
        expectedVersion: 0,
        executionStatus: 'IN_PROGRESS',
        assessmentStatus: 'NOT_ASSESSED',
        observation: null,
        unableToVerifyReason: null,
      }),
    ).rejects.toMatchObject({ status: 409, code: 'CONCURRENT_UPDATE' })
    expect(transport).toHaveBeenCalledTimes(1)
  })
})
