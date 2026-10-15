import { useEffect, useMemo, useRef, useState } from 'react'

import { env } from '../../../../config/env'
import { useI18n } from '../../../../shared/i18n'
import { authenticatedFetch } from '../../../auth/api/authApi'
import { missionApi } from '../../../mission/api/missionApi'
import { backendPreflightTokenStorageKey } from '../../lib/flightWorkflowStorage'
import { preflightGroups } from './components/PreflightItem'
import { preflightChecklistPanelMessages } from './components/PreflightChecklistPanel.messages'
import {
  fetchCurrentPersistedPreflight,
  fetchPersistedPreflight,
  updatePersistedPreflightItem,
} from './preflightApi'
import {
  NO_DRONE_SENTINEL,
  NO_MISSION_SENTINEL,
  RUNTIME_KEY_MAP,
  clearStoredPreflightState,
  controlBaseUrl,
  demoFlightToken,
  isMissionInFlight,
  isWeatherStatus,
  mapRuntimeToItems,
  persistedStatusFromRuntime,
  preflightStateStorageKey,
  readStoredPreflightSession,
  readStoredPreflightState,
  readStoredWeatherState,
  runtimeStatusFromPersisted,
  weatherFormFromStatus,
  weatherStateStorageKey,
  writeStoredPreflightState,
  writeStoredWeatherState,
} from './preflightHelpers'
import type {
  PersistedPreflightItemStatus,
  PersistedPreflightStatus,
  RuntimePreflightStatus,
  WeatherObservationForm,
  WeatherPreflightStatus,
} from './preflightTypes'

export function usePreflightChecklist({
  missionId,
  missionLabel,
  deviceId,
  missionStatus,
  latitude,
  longitude,
}: {
  missionId: string
  missionLabel?: string
  deviceId: string
  missionStatus?: string | null
  latitude?: number | null
  longitude?: number | null
}) {
  const { t, lang } = useI18n(preflightChecklistPanelMessages)
  const PREFLIGHT_GROUPS = useMemo(() => preflightGroups(lang), [lang])
  const RUNTIME_GROUPS = useMemo(
    () =>
      PREFLIGHT_GROUPS.map((group) => ({
        ...group,
        items: group.items.filter((item) =>
          Object.values(RUNTIME_KEY_MAP).includes(item.key),
        ),
      })).filter((group) => group.items.length > 0),
    [PREFLIGHT_GROUPS],
  )
  const ALL_ITEMS = useMemo(
    () => RUNTIME_GROUPS.flatMap((group) => group.items),
    [RUNTIME_GROUPS],
  )
  const storageKey = useMemo(
    () => preflightStateStorageKey(missionId, deviceId),
    [deviceId, missionId],
  )
  const weatherStorageKey = useMemo(
    () => weatherStateStorageKey(missionId, deviceId),
    [deviceId, missionId],
  )
  const [checkId, setCheckId] = useState<string | null>(null)
  const [runtimeStatus, setRuntimeStatus] =
    useState<RuntimePreflightStatus | null>(() =>
      readStoredPreflightState(storageKey),
    )
  const [weatherStatus, setWeatherStatus] =
    useState<WeatherPreflightStatus | null>(() =>
      readStoredWeatherState(weatherStorageKey),
    )
  const [weatherForm, setWeatherForm] = useState<WeatherObservationForm>(() =>
    weatherFormFromStatus(readStoredWeatherState(weatherStorageKey)),
  )
  const [error, setError] = useState<string | null>(null)
  const [backendPreflightMessage, setBackendPreflightMessage] = useState<
    string | null
  >(null)
  const [backendPreflightRegistering, setBackendPreflightRegistering] =
    useState(false)
  const backendPreflightRegisteredRef = useRef(false)
  const [triggering, setTriggering] = useState(false)
  const [weatherSuggesting, setWeatherSuggesting] = useState(false)
  const [weatherError, setWeatherError] = useState<string | null>(null)
  const validatedStoredCheckRef = useRef(false)
  const controllerOfflineMissesRef = useRef(0)
  const [controllerOnline, setControllerOnline] = useState(false)
  const [runtimeSessionId, setRuntimeSessionId] = useState<string | null>(() =>
    readStoredPreflightSession(storageKey),
  )
  const [persistedPreflightId, setPersistedPreflightId] = useState<
    string | null
  >(null)
  const [persistedPreflightStatus, setPersistedPreflightStatus] =
    useState<PersistedPreflightStatus | null>(null)
  const [persistedWeatherPassed, setPersistedWeatherPassed] = useState(false)
  const syncedPersistedItemsRef = useRef<Record<string, string>>({})
  const syncingPersistedItemsRef = useRef(false)

  useEffect(() => {
    validatedStoredCheckRef.current = false
    controllerOfflineMissesRef.current = 0
    syncedPersistedItemsRef.current = {}
    syncingPersistedItemsRef.current = false
    setPersistedPreflightId(null)
    setPersistedPreflightStatus(null)
    setPersistedWeatherPassed(false)
    const storedWeather = readStoredWeatherState(weatherStorageKey)
    setWeatherStatus(storedWeather)
    setWeatherForm(weatherFormFromStatus(storedWeather))
    setRuntimeSessionId(readStoredPreflightSession(storageKey))
  }, [missionId, deviceId, storageKey, weatherStorageKey])

  const itemStates = useMemo(
    () => mapRuntimeToItems(runtimeStatus?.checks ?? []),
    [runtimeStatus],
  )
  const nOk = ALL_ITEMS.filter(
    (item) => itemStates[item.key]?.result === 'ok',
  ).length
  const nTotal = ALL_ITEMS.length
  const failedItems = ALL_ITEMS.filter(
    (item) => itemStates[item.key]?.result === 'fail',
  )
  const runtimeItemsReady = nOk === nTotal && failedItems.length === 0
  const weatherReady =
    weatherStatus?.safeToFly === true || persistedWeatherPassed
  const isReady =
    runtimeItemsReady && weatherReady && persistedPreflightStatus === 'PASSED'
  const progress = runtimeStatus?.progress ?? 0
  const hasTriggered = runtimeStatus !== null || checkId !== null || triggering
  const canContinueToHandover = isReady
  const isAlreadyInFlight = isMissionInFlight(missionStatus)
  const isFailed =
    runtimeStatus?.status === 'FAILED' ||
    persistedPreflightStatus === 'FAILED' ||
    weatherStatus?.safeToFly === false

  useEffect(() => {
    backendPreflightRegisteredRef.current = false
    setBackendPreflightMessage(null)
  }, [missionId, deviceId])

  async function syncRuntimeStatusToBackend(
    status: RuntimePreflightStatus,
    persistedId: string | null,
  ) {
    if (
      !persistedId ||
      status.checkId === 'triggering' ||
      syncingPersistedItemsRef.current
    ) {
      return
    }

    syncingPersistedItemsRef.current = true

    try {
      for (const check of status.checks) {
        const itemStatus = persistedStatusFromRuntime(check.status)
        if (itemStatus === 'PENDING') continue

        const syncKey = `${check.key}:${itemStatus}:${check.message}`
        if (syncedPersistedItemsRef.current[check.key] === syncKey) continue

        const persisted = await updatePersistedPreflightItem(
          persistedId,
          check.key,
          {
            status: itemStatus,
            message: check.message,
          },
        )
        syncedPersistedItemsRef.current[check.key] = syncKey
        if (persisted?.id === persistedId) {
          setPersistedPreflightStatus(persisted.status)
        }
      }
    } catch {
      // The persisted-status poll retries items that have not been saved yet.
    } finally {
      syncingPersistedItemsRef.current = false
    }
  }

  useEffect(() => {
    if (!persistedPreflightId || !weatherStatus) return

    const itemStatus: PersistedPreflightItemStatus = weatherStatus.safeToFly
      ? 'PASSED'
      : 'FAILED'
    const syncKey = `WEATHER:${itemStatus}:${weatherStatus.summary}`
    if (syncedPersistedItemsRef.current.WEATHER === syncKey) return

    let alive = true
    syncedPersistedItemsRef.current.WEATHER = syncKey

    updatePersistedPreflightItem(persistedPreflightId, 'WEATHER', {
      status: itemStatus,
      message: weatherStatus.summary,
    })
      .then((persisted) => {
        if (!alive || persisted.id !== persistedPreflightId) return
        setPersistedPreflightStatus(persisted.status)
        setPersistedWeatherPassed(itemStatus === 'PASSED')
      })
      .catch(() => {
        if (alive) delete syncedPersistedItemsRef.current.WEATHER
      })

    return () => {
      alive = false
    }
  }, [persistedPreflightId, weatherStatus])

  async function handleTriggerCheck() {
    setTriggering(true)
    setError(null)
    setCheckId(null)
    setPersistedPreflightId(null)
    setPersistedPreflightStatus(null)
    setPersistedWeatherPassed(false)
    syncedPersistedItemsRef.current = {}
    syncingPersistedItemsRef.current = false
    backendPreflightRegisteredRef.current = false
    window.sessionStorage.removeItem(
      backendPreflightTokenStorageKey(missionId, deviceId),
    )
    clearStoredPreflightState(storageKey)
    setRuntimeStatus({
      checkId: 'triggering',
      status: 'CHECKING',
      progress: 0,
      checks: ALL_ITEMS.map((item) => ({
        key: item.key,
        name: item.label,
        status: 'CHECKING',
        message: t.statusChecking,
        critical: true,
      })),
    })

    try {
      const response = await fetch(`${controlBaseUrl}/api/preflight/check`, {
        method: 'POST',
      })
      if (!response.ok) throw new Error(`Preflight API ${response.status}`)
      const payload = await response.json()
      setCheckId(payload.checkId)
      setPersistedPreflightId(payload.checkId)
      setPersistedPreflightStatus('CHECKING')
    } catch {
      setRuntimeStatus(null)
      setError(t.triggerFailed)
    } finally {
      setTriggering(false)
    }
  }

  async function handleWeatherSuggestion() {
    setWeatherSuggesting(true)
    setWeatherError(null)

    try {
      if (
        typeof latitude !== 'number' ||
        typeof longitude !== 'number' ||
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude)
      ) {
        throw new Error('Missing mission coordinates')
      }

      const response = await authenticatedFetch(
        `${env.apiBaseUrl}/api/weather/preflight-check`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            missionId:
              missionId === NO_MISSION_SENTINEL ? undefined : missionId,
            deviceId: deviceId === NO_DRONE_SENTINEL ? undefined : deviceId,
            latitude,
            longitude,
          }),
        },
      )
      if (!response.ok) throw new Error(`Weather API ${response.status}`)
      const payload = await response.json()
      const nextStatus = payload.data ?? payload
      if (!isWeatherStatus(nextStatus)) {
        throw new Error('Invalid weather payload')
      }

      setWeatherForm({
        ...weatherFormFromStatus(nextStatus),
        source: 'Hệ thống thời tiết theo tọa độ mission',
      })
      setWeatherStatus(nextStatus)
      writeStoredWeatherState(weatherStorageKey, nextStatus)
      if (missionId !== NO_MISSION_SENTINEL) {
        const persisted = await fetchCurrentPersistedPreflight(missionId)
        if (persisted) {
          setPersistedPreflightId(persisted.id)
          setPersistedPreflightStatus(persisted.status)
          setPersistedWeatherPassed(
            persisted.items.some(
              (item) =>
                item.checkType === 'WEATHER' && item.status === 'PASSED',
            ),
          )
        }
      }
    } catch {
      setWeatherError(t.weatherForecastUnavailable)
    } finally {
      setWeatherSuggesting(false)
    }
  }

  useEffect(() => {
    let alive = true

    async function checkControllerOnline() {
      try {
        const response = await fetch(`${controlBaseUrl}/api/control/status`, {
          cache: 'no-store',
        })
        if (!response.ok) throw new Error(`Controller ${response.status}`)
        const payload = await response.json().catch(() => null)
        const boundToCurrentMission =
          !payload?.missionId ||
          payload.missionId === missionId ||
          payload.missionCode === missionLabel
        const boundToCurrentDevice =
          !payload?.deviceId || payload.deviceId === deviceId
        if (!alive) return
        if (!boundToCurrentMission || !boundToCurrentDevice) {
          throw new Error('Controller bound to another mission')
        }
        const nextRuntimeSessionId =
          typeof payload?.runtimeSessionId === 'string'
            ? payload.runtimeSessionId
            : null
        controllerOfflineMissesRef.current = 0
        setRuntimeSessionId((currentSessionId) => {
          if (
            currentSessionId &&
            nextRuntimeSessionId &&
            currentSessionId !== nextRuntimeSessionId
          ) {
            setCheckId(null)
            setRuntimeStatus(null)
            setPersistedPreflightId(null)
            setPersistedPreflightStatus(null)
            setPersistedWeatherPassed(false)
            syncedPersistedItemsRef.current = {}
            syncingPersistedItemsRef.current = false
            setBackendPreflightMessage(null)
            setWeatherError(null)
            backendPreflightRegisteredRef.current = false
            validatedStoredCheckRef.current = false
            clearStoredPreflightState(storageKey)
          }
          return nextRuntimeSessionId ?? currentSessionId
        })
        setControllerOnline(true)
      } catch {
        if (!alive) return
        setControllerOnline(false)
        controllerOfflineMissesRef.current += 1
        if (controllerOfflineMissesRef.current >= 3) {
          setRuntimeSessionId(null)
          setCheckId(null)
          setRuntimeStatus(null)
          setPersistedPreflightId(null)
          setPersistedPreflightStatus(null)
          setPersistedWeatherPassed(false)
          syncedPersistedItemsRef.current = {}
          syncingPersistedItemsRef.current = false
          setBackendPreflightMessage(null)
          setWeatherError(null)
          backendPreflightRegisteredRef.current = false
          validatedStoredCheckRef.current = false
          clearStoredPreflightState(storageKey)
        }
      }
    }

    void checkControllerOnline()
    const timer = window.setInterval(checkControllerOnline, 2500)
    return () => {
      alive = false
      window.clearInterval(timer)
    }
  }, [deviceId, missionId, missionLabel, storageKey])

  useEffect(() => {
    if (!controllerOnline) return
    if (!missionId || missionId === NO_MISSION_SENTINEL) return
    let alive = true
    const controller = new AbortController()

    async function loadMissionPreflightState() {
      const persisted = await fetchCurrentPersistedPreflight(
        missionId,
        controller.signal,
      ).catch(() => null)
      if (!alive || !persisted) return
      const persistedRuntime = runtimeStatusFromPersisted(persisted)
      setPersistedPreflightId(persisted.id)
      setPersistedPreflightStatus(persisted.status)
      setPersistedWeatherPassed(
        persisted.items.some(
          (item) => item.checkType === 'WEATHER' && item.status === 'PASSED',
        ),
      )
      setRuntimeStatus((current) => {
        if (current?.checkId === persisted.id) return current
        writeStoredPreflightState(
          storageKey,
          persistedRuntime,
          runtimeSessionId,
        )
        return persistedRuntime
      })
    }

    void loadMissionPreflightState()
    return () => {
      alive = false
      controller.abort()
    }
  }, [controllerOnline, missionId, runtimeSessionId, storageKey])

  useEffect(() => {
    if (!checkId) return
    let alive = true

    async function poll() {
      try {
        const response = await fetch(
          `${controlBaseUrl}/api/preflight/${checkId}`,
          { cache: 'no-store' },
        )
        if (!response.ok) throw new Error(`Preflight status ${response.status}`)
        const payload = await response.json()
        if (!alive) return
        setRuntimeStatus(payload)
        writeStoredPreflightState(storageKey, payload, runtimeSessionId)
        void syncRuntimeStatusToBackend(payload, persistedPreflightId)
        if (payload.status === 'READY' || payload.status === 'FAILED') {
          setCheckId(null)
        }
      } catch {
        if (!alive) return
        setError(t.precheckConnectionLost)
        setCheckId(null)
      }
    }

    void poll()
    const timer = window.setInterval(poll, 800)
    return () => {
      alive = false
      window.clearInterval(timer)
    }
  }, [checkId, persistedPreflightId, runtimeSessionId, storageKey])

  useEffect(() => {
    const weatherPassed =
      weatherStatus?.safeToFly === true || persistedWeatherPassed
    if (
      !runtimeItemsReady ||
      !weatherPassed ||
      !persistedPreflightId ||
      persistedPreflightStatus !== 'CHECKING'
    ) {
      return
    }

    const activePersistedId = persistedPreflightId
    let alive = true
    const controller = new AbortController()

    async function refreshPersistedStatus() {
      const persisted = await fetchPersistedPreflight(
        activePersistedId,
        controller.signal,
      ).catch(() => null)
      if (!alive || !persisted || persisted.id !== activePersistedId) return

      setPersistedPreflightStatus(persisted.status)
      setPersistedWeatherPassed(
        persisted.items.some(
          (item) => item.checkType === 'WEATHER' && item.status === 'PASSED',
        ),
      )

      if (runtimeStatus) {
        let hasBackendLag = false
        for (const check of runtimeStatus.checks) {
          const expected = persistedStatusFromRuntime(check.status)
          const actual = persisted.items.find(
            (item) => item.checkType === check.key,
          )?.status
          if (
            (expected === 'PASSED' || expected === 'FAILED') &&
            actual !== expected
          ) {
            delete syncedPersistedItemsRef.current[check.key]
            hasBackendLag = true
          }
        }
        if (hasBackendLag) {
          void syncRuntimeStatusToBackend(runtimeStatus, activePersistedId)
        }
      }
    }

    void refreshPersistedStatus()
    const timer = window.setInterval(refreshPersistedStatus, 800)
    return () => {
      alive = false
      controller.abort()
      window.clearInterval(timer)
    }
  }, [
    persistedPreflightId,
    persistedPreflightStatus,
    persistedWeatherPassed,
    runtimeItemsReady,
    runtimeStatus,
    weatherStatus?.safeToFly,
  ])

  useEffect(() => {
    if (
      validatedStoredCheckRef.current ||
      checkId ||
      triggering ||
      !runtimeStatus ||
      runtimeStatus.checkId === 'triggering'
    ) {
      return
    }
    validatedStoredCheckRef.current = true
    const storedCheckId = runtimeStatus.checkId
    let alive = true

    async function validateStoredPreflight() {
      try {
        const response = await fetch(
          `${controlBaseUrl}/api/preflight/${storedCheckId}`,
          { cache: 'no-store' },
        )
        if (!response.ok) throw new Error(`Stored preflight ${response.status}`)
        const payload = await response.json()
        if (!alive) return
        setRuntimeStatus(payload)
        writeStoredPreflightState(storageKey, payload, runtimeSessionId)
        void syncRuntimeStatusToBackend(payload, persistedPreflightId)
      } catch {
        if (!alive) return
        setCheckId(null)
      }
    }

    void validateStoredPreflight()
    return () => {
      alive = false
    }
  }, [
    checkId,
    missionId,
    runtimeSessionId,
    runtimeStatus,
    persistedPreflightId,
    storageKey,
    triggering,
  ])

  useEffect(() => {
    if (
      !canContinueToHandover ||
      isAlreadyInFlight ||
      backendPreflightRegisteredRef.current ||
      missionId === NO_MISSION_SENTINEL ||
      deviceId === NO_DRONE_SENTINEL
    ) {
      return
    }

    backendPreflightRegisteredRef.current = true
    let alive = true

    async function registerBackendPreflight() {
      setBackendPreflightRegistering(true)
      setBackendPreflightMessage(t.switchingToReady)
      try {
        if (!alive) return
        const completedPreflight = await missionApi.runPreflightCheck(
          missionId,
          deviceId,
        )
        window.sessionStorage.setItem(
          backendPreflightTokenStorageKey(missionId, deviceId),
          completedPreflight.flightToken?.tokenValue ??
            demoFlightToken(missionId, deviceId),
        )
        setBackendPreflightMessage(t.backendSwitchedReady)
      } catch (cause) {
        if (!alive) return
        backendPreflightRegisteredRef.current = false
        setBackendPreflightMessage(
          cause instanceof Error
            ? cause.message
            : t.backendPreflightUnconfirmed,
        )
      } finally {
        if (alive) setBackendPreflightRegistering(false)
      }
    }

    void registerBackendPreflight()

    return () => {
      alive = false
    }
  }, [canContinueToHandover, deviceId, isAlreadyInFlight, missionId])

  return {
    RUNTIME_GROUPS,
    itemStates,
    nOk,
    nTotal,
    failedItems,
    progress,
    hasTriggered,
    canContinueToHandover,
    isAlreadyInFlight,
    isFailed,
    error,
    triggering,
    handleTriggerCheck,
    backendPreflightMessage,
    backendPreflightRegistering,
    weatherStatus,
    weatherForm,
    setWeatherForm,
    weatherSuggesting,
    weatherError,
    handleWeatherSuggestion,
  }
}
