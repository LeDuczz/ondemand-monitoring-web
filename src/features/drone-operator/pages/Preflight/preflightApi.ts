import { env } from '../../../../config/env'
import { authenticatedFetch } from '../../../auth/api/authApi'
import type {
  PersistedPreflightCheck,
  PersistedPreflightUpdate,
} from './preflightTypes'

export async function fetchCurrentPersistedPreflight(
  missionId: string,
  signal?: AbortSignal,
) {
  const response = await authenticatedFetch(
    `${env.apiBaseUrl}/api/missions/${encodeURIComponent(missionId)}/pre-device-checks/current`,
    { cache: 'no-store', signal },
  )
  if (!response.ok) return null
  const payload = await response.json()
  const persisted = payload?.data ?? payload
  if (!persisted || typeof persisted.id !== 'string') return null
  return persisted as PersistedPreflightCheck
}

export async function fetchPersistedPreflight(
  persistedId: string,
  signal?: AbortSignal,
) {
  const response = await authenticatedFetch(
    `${env.apiBaseUrl}/api/pre-device-checks/${encodeURIComponent(persistedId)}`,
    { cache: 'no-store', signal },
  )
  if (!response.ok) return null
  const payload = await response.json()
  const persisted = payload?.data ?? payload
  if (!persisted || typeof persisted.id !== 'string') return null
  return persisted as PersistedPreflightCheck
}

export async function updatePersistedPreflightItem(
  persistedId: string,
  checkType: string,
  update: PersistedPreflightUpdate,
) {
  const response = await authenticatedFetch(
    `${env.apiBaseUrl}/api/pre-device-checks/${encodeURIComponent(persistedId)}/items/${encodeURIComponent(checkType)}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update),
    },
  )
  if (!response.ok) {
    throw new Error(`Persisted preflight item ${checkType} ${response.status}`)
  }
  const payload = await response.json()
  const persisted = payload?.data ?? payload
  return persisted as PersistedPreflightCheck
}
