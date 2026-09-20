import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { resetMockDb } from '../db'
import '../index'
import { mediaApi } from '../../features/manager/api/mediaApi'

beforeEach(() => resetMockDb())
afterEach(() => resetMockDb())

describe('GET /api/media?needs_action=true', () => {
  it('returns manualUploadTasks, badMediaItems, and waitingDeliveryMissions', async () => {
    const data = await mediaApi.listNeedsAction()
    expect(data.manualUploadTasks.length).toBeGreaterThan(0)
    expect(data.badMediaItems.length).toBeGreaterThan(0)
    expect(data.waitingDeliveryMissions.length).toBeGreaterThan(0)
  })

  it('manual upload tasks have required fields', async () => {
    const data = await mediaApi.listNeedsAction()
    const task = data.manualUploadTasks[0]
    expect(task).toHaveProperty('id')
    expect(task).toHaveProperty('fileName')
    expect(task).toHaveProperty('missionCode')
    expect(task).toHaveProperty('assignedOperatorName')
    expect(task).toHaveProperty('taskStatus')
    expect(task.mediaStatus).toBe('MANUAL_REQUIRED')
  })

  it('bad media items have validationError', async () => {
    const data = await mediaApi.listNeedsAction()
    const item = data.badMediaItems[0]
    expect(item.mediaStatus).toBe('VALIDATION_FAILED')
    expect(item.validationError).toBeTruthy()
  })

  it('waiting delivery missions have orderId and missionCode', async () => {
    const data = await mediaApi.listNeedsAction()
    const mission = data.waitingDeliveryMissions[0]
    expect(mission.orderId).toBeTruthy()
    expect(mission.missionCode).toBeTruthy()
    expect(mission.missionStatus).toBe('COMPLETED')
  })
})

describe('POST /api/manual-upload-tasks/:id/reassign', () => {
  it('reassigns task to a new operator', async () => {
    const updated = await mediaApi.reassignTask('mut-001', 'op-bui-anh-tuan')
    expect(updated.assignedOperatorId).toBe('op-bui-anh-tuan')
    expect(updated.assignedOperatorName).toBe('Bùi Anh Tuấn')
  })
})

describe('POST /api/media/:id/request-reupload', () => {
  it('requests reupload and resets status to PENDING_UPLOAD', async () => {
    const result = await mediaApi.requestReupload(
      'med-003',
      'File rỗng, cần upload lại',
    )
    expect((result as unknown as Record<string, unknown>)['mediaStatus']).toBe(
      'PENDING_UPLOAD',
    )
  })
})
