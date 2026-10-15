import type { CreateMissionRequest } from '../types/missions'

type Intent = Pick<
  CreateMissionRequest,
  'scopeLabel' | 'scheduledStart' | 'scheduledEnd' | 'replacesMissionId'
>
const prefix = 'odms:pending-mission-creation:'

/** Persist an unresolved command through retries/reloads; public plan revision is not identity. */
export function missionCreationKey(orderId: string, intent: Intent): string {
  const fingerprint = JSON.stringify([
    orderId,
    intent.scopeLabel.normalize('NFC').trim().replace(/\s+/g, ' '),
    new Date(intent.scheduledStart).toISOString(),
    new Date(intent.scheduledEnd).toISOString(),
    intent.replacesMissionId ?? null,
  ])
  const storageKey = prefix + orderId
  const stored = sessionStorage.getItem(storageKey)
  if (stored) {
    try {
      const command = JSON.parse(stored) as { fingerprint: string; key: string }
      if (
        command.fingerprint === fingerprint &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          command.key,
        )
      )
        return command.key
    } catch {
      /* A corrupt local draft is not a valid pending command. */
    }
  }
  const key = crypto.randomUUID()
  sessionStorage.setItem(storageKey, JSON.stringify({ fingerprint, key }))
  return key
}

export function clearMissionCreationKey(orderId: string): void {
  sessionStorage.removeItem(prefix + orderId)
}
