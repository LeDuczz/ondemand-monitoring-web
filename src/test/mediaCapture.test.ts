import { afterEach, describe, expect, it, vi } from 'vitest'

import { FakeFlightControllerMediaClient } from '../features/media/api/fakeFlightControllerMediaClient'

describe('FakeFlightControllerMediaClient contract', () => {
  afterEach(() => vi.useRealTimers())

  it('captures media into review pending without uploading automatically', async () => {
    vi.useFakeTimers()
    const client = new FakeFlightControllerMediaClient()
    const connected = client.connect()
    await vi.advanceTimersByTimeAsync(250)
    await connected

    const capture = client.captureImage(
      'capture-1',
      'FLOW4-MISSION-001',
      'DRONE-01',
    )
    await vi.advanceTimersByTimeAsync(400)
    const ack = await capture
    const mediaRequest = client.listMedia('FLOW4-MISSION-001')
    await vi.advanceTimersByTimeAsync(180)
    const media = await mediaRequest

    expect(ack.state).toBe('SUCCEEDED')
    expect(ack.media?.status).toBe('REVIEW_PENDING')
    expect(
      media.some((item) => item.localMediaId === ack.media?.localMediaId),
    ).toBe(true)
  })

  it('discards a selected local media item and keeps the audit item', async () => {
    vi.useFakeTimers()
    const client = new FakeFlightControllerMediaClient()
    const mediaRequest = client.listMedia('FLOW4-MISSION-001')
    await vi.advanceTimersByTimeAsync(180)
    const media = (await mediaRequest)[0]
    const discard = client.discardMedia('discard-1', media.localMediaId)
    await vi.advanceTimersByTimeAsync(240)

    expect((await discard).media?.status).toBe('DISCARDED')
    const listRequest = client.listMedia('FLOW4-MISSION-001')
    await vi.advanceTimersByTimeAsync(180)
    expect(
      (await listRequest).some(
        (item) => item.localMediaId === media.localMediaId,
      ),
    ).toBe(true)
  })

  it('emits async upload transitions and finishes as available', async () => {
    vi.useFakeTimers()
    const client = new FakeFlightControllerMediaClient()
    const mediaRequest = client.listMedia('FLOW4-MISSION-001')
    await vi.advanceTimersByTimeAsync(180)
    const media = (await mediaRequest)[0]
    const states: string[] = []
    const commandId = 'upload-1'
    client.watchCommand(commandId, (update) =>
      states.push(update.media?.status ?? update.state),
    )

    const ack = await client.uploadMedia(commandId, media.localMediaId)
    await vi.advanceTimersByTimeAsync(2300)

    expect(ack.state).toBe('ACCEPTED')
    expect(states).toEqual([
      'UPLOAD_PENDING',
      'UPLOADING',
      'VALIDATING',
      'AVAILABLE',
    ])
    const listRequest = client.listMedia('FLOW4-MISSION-001')
    await vi.advanceTimersByTimeAsync(180)
    expect(
      (await listRequest).find(
        (item) => item.localMediaId === media.localMediaId,
      )?.status,
    ).toBe('AVAILABLE')
  })
})
