import { customerApi, type CustomerConsultation } from '../../api/customerApi'
import { CONSULTATION_REQUEST_TIMEOUT_MS } from './consultation'

const RECOVER_ATTEMPTS = 12
const RECOVER_DELAY_MS = 1200

/** Aborts `run` after the consultation timeout so a slow AI never freezes the UI. */
export async function withConsultationTimeout<T>(
  run: (signal: AbortSignal) => Promise<T>,
) {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), CONSULTATION_REQUEST_TIMEOUT_MS)
  try {
    return await run(controller.signal)
  } finally {
    clearTimeout(id)
  }
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * After a failed send, polls the session until the assistant's reply shows up
 * (the BE may finish it late). Returns null if it never does; API errors throw.
 */
export async function pollForAssistantReply(
  consultationId: string,
): Promise<CustomerConsultation | null> {
  for (let attempt = 0; attempt < RECOVER_ATTEMPTS; attempt += 1) {
    if (attempt > 0) await wait(RECOVER_DELAY_MS)
    const latest = await customerApi.getConsultation(consultationId)
    if (latest.messages?.some((m) => m.senderType === 'ASSISTANT')) return latest
  }
  return null
}
