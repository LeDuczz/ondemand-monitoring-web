import { useCallback, useState } from 'react'
import { useI18n } from '../../../../shared/i18n'
import { missionApi } from '../../../mission/api/missionApi'
import { flightControlApi } from '../../api/flightControlApi'
import { markActiveMissionFlowStep } from '../../api/liveMission'
import { operatorHref } from '../../routes'
import type { Drone, Mission } from '../../types/omss'
import { missionHasSafeStop } from '../../../mission/lib/missionOperationalState'
import { controlBaseUrl } from './inFlightConstants'
import type { WeatherPreset } from './inFlightTypes'
import { navigateOperator } from './navigateOperator'
import { missionActionsMessages } from './useMissionActions.messages'

/** Review media, finish flight and weather preset handlers of the cockpit. */
export function useMissionActions({
  mission,
  drone,
  onReviewMedia,
  onStartFlight,
  setLastCommand,
  setIsOnline,
}: {
  mission: Mission
  drone: Drone
  onReviewMedia?: () => void
  /** Moves the business Mission to IN_FLIGHT once the cockpit starts the real flight. */
  onStartFlight?: () => Promise<void>
  setLastCommand: (message: string) => void
  setIsOnline: (online: boolean) => void
}) {
  const { t } = useI18n(missionActionsMessages)
  const [finishFlightBusy, setFinishFlightBusy] = useState(false)
  const [startFlightBusy, setStartFlightBusy] = useState(false)
  const handleReviewMedia = useCallback(() => {
    const missionId = mission.backendId ?? mission.id
    markActiveMissionFlowStep(missionId, 5)
    if (onReviewMedia) {
      onReviewMedia()
      return
    }
    navigateOperator(operatorHref({ screen: 'upload', missionId }))
  }, [mission.backendId, mission.id, onReviewMedia])
  const handleStartFlight = useCallback(async () => {
    if (!onStartFlight || startFlightBusy) return
    setStartFlightBusy(true)
    setLastCommand(t.startingFlight)
    try {
      await onStartFlight()
      setLastCommand(t.flightStarted)
    } catch (error) {
      setLastCommand(
        error instanceof Error ? error.message : t.controllerOffline,
      )
    } finally {
      setStartFlightBusy(false)
    }
  }, [onStartFlight, startFlightBusy, setLastCommand, t])
  const handleFinishFlight = useCallback(async () => {
    if (finishFlightBusy) return
    const missionId = mission.backendId ?? mission.id
    setFinishFlightBusy(true)
    setLastCommand(t.finishingFlight)
    try {
      const current = await missionApi.getMissionById(missionId)
      const stopping = missionHasSafeStop(current)
      if (stopping) {
        const latest = await flightControlApi.status()
        if (
          latest.missionId !== missionId ||
          latest.deviceId !== drone.id ||
          latest.inAir !== false
        )
          throw new Error(t.mustLand)
        if (current.status === 'IN_FLIGHT' || current.status === 'IN_PROGRESS')
          await missionApi.markReturning(missionId)
        await flightControlApi.releaseSession(missionId)
      } else {
        await missionApi.markReturning(missionId).catch(() => undefined)
      }
      await missionApi.startPostflight(missionId)
      markActiveMissionFlowStep(missionId, 5)
      setLastCommand(t.flightFinished)
      navigateOperator(
        operatorHref(
          stopping
            ? { screen: 'missionDetail', missionId }
            : { screen: 'missions' },
        ),
      )
    } catch (error) {
      setLastCommand(
        error instanceof Error ? error.message : t.controllerOffline,
      )
    } finally {
      setFinishFlightBusy(false)
    }
  }, [
    finishFlightBusy,
    mission.backendId,
    mission.id,
    drone.id,
    onReviewMedia,
    setLastCommand,
    t,
  ])
  const handleWeatherPreset = useCallback(
    async (preset: WeatherPreset) => {
      setLastCommand(
        t.settingWeather(preset.replaceAll('_', ' ').toLowerCase()),
      )
      try {
        const response = await fetch(`${controlBaseUrl}/api/control/command`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command: 'weather_set', preset }),
        })
        const payload = await response.json()
        const weather = payload.weather as
          { status?: string; weatherLabel?: string } | undefined
        if (!response.ok || !weather) throw new Error(`HTTP ${response.status}`)
        const label = weather?.weatherLabel ?? preset.replaceAll('_', ' ')
        const status = weather?.status ?? 'UPDATED'
        setLastCommand(
          payload.ok === false
            ? t.weatherPending(label, status)
            : t.weatherUpdated(label, status),
        )
        setIsOnline(true)
      } catch {
        setLastCommand(t.weatherOffline)
        setIsOnline(false)
      }
    },
    [setIsOnline, setLastCommand, t],
  )

  return {
    handleReviewMedia,
    handleStartFlight,
    startFlightBusy,
    handleFinishFlight,
    finishFlightBusy,
    handleWeatherPreset,
  } as const
}
