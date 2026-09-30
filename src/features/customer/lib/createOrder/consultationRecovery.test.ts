import { afterEach, describe, expect, it, vi } from 'vitest'

import { customerApi } from '../../api/customerApi'
import { CONSULTATION_REQUEST_TIMEOUT_MS } from './consultation'
import { pollForAssistantReply, withConsultationTimeout } from './consultationRecovery'

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('pollForAssistantReply', () => {
  it('returns the session as soon as an assistant message exists', async () => {
    const spy = vi.spyOn(customerApi, 'getConsultation').mockResolvedValue({
      id: 'c',
      messages: [{ id: 'm', senderType: 'ASSISTANT', message: 'hi' }],
    })
    await expect(pollForAssistantReply('c')).resolves.toMatchObject({ id: 'c' })
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('polls again after a delay when the reply is not there yet', async () => {
    vi.useFakeTimers()
    const spy = vi
      .spyOn(customerApi, 'getConsultation')
      .mockResolvedValueOnce({ id: 'c', messages: [] })
      .mockResolvedValueOnce({
        id: 'c',
        messages: [{ id: 'm', senderType: 'ASSISTANT', message: 'late' }],
      })
    const pending = pollForAssistantReply('c')
    await vi.advanceTimersByTimeAsync(1500)
    await expect(pending).resolves.toMatchObject({ id: 'c' })
    expect(spy).toHaveBeenCalledTimes(2)
  })

  it('propagates API errors', async () => {
    vi.spyOn(customerApi, 'getConsultation').mockRejectedValue(new Error('gone'))
    await expect(pollForAssistantReply('c')).rejects.toThrow('gone')
  })
})

describe('withConsultationTimeout', () => {
  it('aborts the signal after the timeout', async () => {
    vi.useFakeTimers()
    let aborted = false
    const pending = withConsultationTimeout(
      (signal) =>
        new Promise<void>((resolve) =>
          signal.addEventListener('abort', () => {
            aborted = true
            resolve()
          }),
        ),
    )
    await vi.advanceTimersByTimeAsync(CONSULTATION_REQUEST_TIMEOUT_MS + 1)
    await pending
    expect(aborted).toBe(true)
  })

  it('returns the result when the work finishes in time', async () => {
    await expect(withConsultationTimeout(async () => 42)).resolves.toBe(42)
  })
})
