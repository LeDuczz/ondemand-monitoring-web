import { useCallback, useEffect, useState } from 'react'
import { useI18n } from '../../../../shared/i18n'
import { preflightReadyMessages } from './usePreflightReady.messages'

export function usePreflightReady({
  preflightStorageKey,
  requiresBackendPreflight,
  normalFlightAllowed,
  onPreflightReady,
  setLastCommand,
}: {
  preflightStorageKey: string
  requiresBackendPreflight: boolean
  normalFlightAllowed: boolean
  onPreflightReady?: () => Promise<void>
  setLastCommand: (message: string) => void
}) {
  const { t } = useI18n(preflightReadyMessages)
  const [preflightReady, setPreflightReady] = useState(() => {
    if (requiresBackendPreflight) return false
    try {
      return window.localStorage.getItem(preflightStorageKey) === 'true'
    } catch {
      return false
    }
  })

  useEffect(() => {
    if (requiresBackendPreflight) {
      setPreflightReady(false)
      return
    }
    try {
      setPreflightReady(
        window.localStorage.getItem(preflightStorageKey) === 'true',
      )
    } catch {
      setPreflightReady(false)
    }
  }, [preflightStorageKey, requiresBackendPreflight])

  const handlePreflightReady = useCallback(async () => {
    if (!normalFlightAllowed) throw new Error(t.notAllowed)
    await onPreflightReady?.()
    try {
      window.localStorage.setItem(preflightStorageKey, 'true')
    } catch {
      // Ignore storage failures; the current screen can still continue.
    }
    setPreflightReady(true)
    setLastCommand(t.preflightCompleted)
  }, [normalFlightAllowed, onPreflightReady, preflightStorageKey, t])

  return { preflightReady, handlePreflightReady } as const
}
