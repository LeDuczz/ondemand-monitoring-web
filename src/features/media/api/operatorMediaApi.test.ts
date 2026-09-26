// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { operatorMediaApi, type LocalMedia } from './operatorMediaApi'
import { authenticatedFetch } from '../../auth/api/authApi'

vi.mock('../../auth/api/authApi', () => ({ authenticatedFetch: vi.fn() }))

const item: LocalMedia = {
  localMediaId: 'capture', missionId: 'mission', droneCode: 'DRN-0050',
  mediaType: 'IMAGE', fileName: 'capture.jpg', contentType: 'image/jpeg',
  fileSize: 100, checksumSha256: 'a'.repeat(64), capturedAt: '2026-09-26T00:00:00Z',
  status: 'REVIEW_PENDING',
}
const plan = (status: string) => ({ mediaId: 'media', attemptId: 'attempt', status,
  uploadMethod: 'PUT', uploadUrl: 'https://example.test/upload', uploadHeaders: {}, partCount: 0 })
const response = (data: unknown) => Promise.resolve(new Response(JSON.stringify({ success: true, data }),
  { status: 200, headers: { 'Content-Type': 'application/json' } }))

describe('operator media retry workflow', () => {
  beforeEach(() => { vi.clearAllMocks(); localStorage.clear() })
  afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers() })

  it('does not silently start a manual attempt', async () => {
    vi.mocked(authenticatedFetch).mockImplementation(() => response(plan('MANUAL_UPLOAD_REQUIRED')))
    await expect(operatorMediaApi.upload(item)).rejects.toThrow('upload thủ công')
    expect(authenticatedFetch).toHaveBeenCalledTimes(1)
  })

  it('retries only after a confirmed failure and stops after the third attempt', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Connection lost')))
    let failures = 0
    vi.mocked(authenticatedFetch).mockImplementation((url) => {
      if (String(url).endsWith('/failures')) {
        failures++
        return response(plan(failures === 3 ? 'MANUAL_UPLOAD_REQUIRED' : 'RETRY_REQUIRED'))
      }
      return response(plan('UPLOAD_PENDING'))
    })
    const result = expect(operatorMediaApi.upload(item)).rejects.toThrow('Task upload thủ công')
    await vi.runAllTimersAsync()
    await result
    expect(failures).toBe(3)
    expect(fetch).toHaveBeenCalledTimes(3)
  })

  it('treats an object found by backend as validating, not as a retry', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Response lost')))
    vi.mocked(authenticatedFetch).mockImplementation((url) =>
      response(plan(String(url).endsWith('/failures') ? 'VALIDATING' : 'UPLOAD_PENDING')))
    await expect(operatorMediaApi.upload(item)).resolves.toBe('media')
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('loads manual tasks from backend even when Flight Controller is offline', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Controller offline')))
    vi.mocked(authenticatedFetch).mockImplementation(() => response([
      { ...item, backendMediaId: 'media', manualTaskId: 'task', status: 'MANUAL_UPLOAD_REQUIRED' },
    ]))
    const result = await operatorMediaApi.reviewItems('mission')
    expect(result).toHaveLength(1)
    expect(result[0].localAvailable).toBe(false)
    expect(result[0].manualTaskId).toBe('task')
  })
})
