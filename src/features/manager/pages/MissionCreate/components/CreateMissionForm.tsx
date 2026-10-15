import type { OrderMissionBrief } from '../../../types/orders'
import { useI18n } from '../../../../../shared/i18n'
import { planningPresentationMessages } from '../../../components/common/planningPresentation.messages'
import { useState, useEffect, useMemo } from 'react'
import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import { planningApi } from '../../../api/planningApi'
import { missionsApi } from '../../../api/missionsApi'
import {
  type SubmitState,
  dateRangeFromBrief,
  forecastTimeFromBrief,
  loadForecastRows,
  loadingForecastRows,
  toLocalInput,
  type ForecastRow,
} from '../createMissionHelpers'
import {
  missionCreationKey,
  clearMissionCreationKey,
} from '../../../api/missionCreationIntent'
import { managerHref } from '../../../routes'
import { ApiError } from '../../../../../shared/api/httpClient'
import { planningError } from '../../../lib/planningErrors'
import { OrderWorkflowStepper } from '../../../components/common/OrderWorkflowStepper'
import { createMissionFormMessages } from './CreateMissionForm.messages'
import { PlanFailedState } from './PlanFailedState'
import { MissionCreateHeader } from './MissionCreateHeader'
import { PlanningContextCard } from './PlanningContextCard'
import { CustomerTimeWindowCard } from './CustomerTimeWindowCard'
import { WeatherForecastCard } from './WeatherForecastCard'
import { FlightScheduleCard } from './FlightScheduleCard'
import { OrderSummaryCard } from './OrderSummaryCard'
import { MissionCreateActionBar } from './MissionCreateActionBar'

export function CreateMissionForm({
  orderId,
  brief,
  now,
  replacesMissionId,
  onCreated,
}: {
  orderId: string
  brief: OrderMissionBrief
  now: Date
  replacesMissionId?: string
  onCreated?: (missionId: string) => void
}) {
  const { t } = useI18n(createMissionFormMessages)
  const { t: planningT } = useI18n(planningPresentationMessages)
  void now

  const [scheduledStart, setScheduledStart] = useState('')
  const [scheduledEnd, setScheduledEnd] = useState('')
  const [weatherCheckDate, setWeatherCheckDate] = useState(
    () => dateRangeFromBrief(brief)[0] ?? '',
  )
  const [weatherCheckTime, setWeatherCheckTime] = useState(() =>
    forecastTimeFromBrief(brief),
  )
  const [planRevision, setPlanRevision] = useState(
    brief.executionPlanRevision ?? 0,
  )
  const [scopeLabel, setScopeLabel] = useState('Whole Order scope')
  const planQuery = useApiQuery(
    (signal) => planningApi.getExecutionPlan(orderId, signal),
    [orderId],
  )
  const replacementQuery = useApiQuery(
    (signal) =>
      replacesMissionId
        ? missionsApi.getMissionResponse(replacesMissionId, signal)
        : Promise.resolve(null),
    [replacesMissionId],
  )
  useEffect(() => {
    if (planQuery.data) setPlanRevision(planQuery.data.revision)
  }, [planQuery.data])
  const [submit, setSubmit] = useState<SubmitState>({ kind: 'idle' })
  const [navigateTo, setNavigateTo] = useState<string | null>(null)
  const fillFromCustomer = () => {
    const first = dateRangeFromBrief(brief)[0]
    if (!first) return
    const start = new Date(`${first}T${forecastTimeFromBrief(brief)}`)
    if (Number.isNaN(start.getTime())) return
    setScheduledStart(toLocalInput(start))
    setScheduledEnd(toLocalInput(new Date(start.getTime() + 60 * 60 * 1000)))
    setSubmit({ kind: 'idle' })
  }

  // Embedded in Order planning the manager checks one chosen day/time; the
  // standalone page shows every day of the customer's window.
  const forecastDates = useMemo(
    () =>
      onCreated
        ? weatherCheckDate
          ? [weatherCheckDate]
          : []
        : dateRangeFromBrief(brief),
    [brief, onCreated, weatherCheckDate],
  )
  const forecastTime = onCreated
    ? weatherCheckTime
    : forecastTimeFromBrief(brief)
  const [forecastRows, setForecastRows] = useState<ForecastRow[]>(() =>
    loadingForecastRows(forecastDates),
  )

  useEffect(() => {
    if (!brief.center || forecastDates.length === 0) {
      setForecastRows([])
      return
    }
    let cancelled = false
    setForecastRows(loadingForecastRows(forecastDates))
    loadForecastRows(brief.center, forecastDates, forecastTime).then((rows) => {
      if (!cancelled) setForecastRows(rows)
    })
    return () => {
      cancelled = true
    }
  }, [brief.center, forecastDates, forecastTime])

  if (navigateTo) {
    window.location.hash = navigateTo
    return null
  }

  async function handleSubmit() {
    if (
      submit.kind === 'submitting' ||
      planQuery.loading ||
      planQuery.error ||
      planQuery.data?.planStatus !== 'DRAFT' ||
      replacementQuery.loading ||
      replacementQuery.error ||
      (replacesMissionId &&
        (replacementQuery.data?.status !== 'CANCELLED' ||
          replacementQuery.data.orderId !== orderId))
    )
      return
    if (!scopeLabel.trim()) {
      setSubmit({ kind: 'validationFailed', message: planningT.scopeRequired })
      return
    }
    if (!scheduledStart || !scheduledEnd) {
      setSubmit({
        kind: 'validationFailed',
        message: t.validationRequired,
      })
      return
    }
    const startDate = new Date(scheduledStart)
    const endDate = new Date(scheduledEnd)
    if (endDate <= startDate) {
      setSubmit({
        kind: 'validationFailed',
        message: t.validationInvalidRange,
      })
      return
    }
    setSubmit({ kind: 'submitting' })
    try {
      const intent = {
        scopeLabel: scopeLabel.trim(),
        ...(replacesMissionId ? { replacesMissionId } : {}),
        scheduledStart: startDate.toISOString(),
        scheduledEnd: endDate.toISOString(),
      }
      const mission = await missionsApi.createMission(orderId, {
        ...intent,
        idempotencyKey: missionCreationKey(orderId, intent),
        expectedPlanRevision: planRevision,
      })
      clearMissionCreationKey(orderId)
      if (onCreated) onCreated(mission.id)
      else setNavigateTo(managerHref({ screen: 'orderReview', orderId }))
    } catch (err) {
      if (
        err instanceof ApiError &&
        err.code === 'EXECUTION_PLAN_REVISION_CONFLICT'
      ) {
        try {
          const current = await planningApi.getExecutionPlan(orderId)
          setPlanRevision(current.revision)
          planQuery.reload()
        } catch {
          /* Keep the unresolved command/key; the user can reload and retry. */
        }
      }
      if (err instanceof ApiError && err.status === 422) {
        setSubmit({
          kind: 'planFailed',
          message: t.planGenerationFailed,
        })
        return
      }
      setSubmit({
        kind: 'validationFailed',
        message: planningError(err),
      })
    }
  }

  if (submit.kind === 'planFailed') {
    return (
      <PlanFailedState
        onCreated={onCreated}
        submit={submit}
        setSubmit={setSubmit}
      />
    )
  }

  const durationMinutes =
    scheduledStart && scheduledEnd
      ? Math.round(
          (new Date(scheduledEnd).getTime() -
            new Date(scheduledStart).getTime()) /
            60000,
        )
      : null
  const durationText =
    durationMinutes != null && durationMinutes > 0
      ? t.durationHours(Math.floor(durationMinutes / 60), durationMinutes % 60)
      : null
  const submitting = submit.kind === 'submitting'

  return (
    <div className="odm-or odm-or-review-page odm-plan-page">
      {!onCreated && (
        <MissionCreateHeader
          orderId={orderId}
          brief={brief}
          planQuery={planQuery}
          planRevision={planRevision}
        />
      )}

      {!onCreated && <OrderWorkflowStepper currentStep={5} />}

      <div className="odm-or-layout">
        <div className="odm-or-main">
          <PlanningContextCard
            onCreated={onCreated}
            planQuery={planQuery}
            planRevision={planRevision}
            scopeLabel={scopeLabel}
            setScopeLabel={setScopeLabel}
            submit={submit}
            replacesMissionId={replacesMissionId}
            replacementQuery={replacementQuery}
          />

          <FlightScheduleCard
            durationText={durationText}
            canFillFromCustomer={forecastRows.length > 0}
            fillFromCustomer={fillFromCustomer}
            scheduledStart={scheduledStart}
            setScheduledStart={setScheduledStart}
            scheduledEnd={scheduledEnd}
            setScheduledEnd={setScheduledEnd}
            submit={submit}
            scopeLabel={scopeLabel}
          />
        </div>

        <aside className="odm-or-side">
          <OrderSummaryCard brief={brief} />
          <CustomerTimeWindowCard brief={brief} />
          <WeatherForecastCard
            forecastTime={forecastTime}
            brief={brief}
            forecastRows={forecastRows}
            checkControls={
              onCreated
                ? {
                    date: weatherCheckDate,
                    time: weatherCheckTime,
                    onDateChange: setWeatherCheckDate,
                    onTimeChange: setWeatherCheckTime,
                  }
                : undefined
            }
          />
        </aside>
      </div>

      <MissionCreateActionBar
        handleSubmit={handleSubmit}
        submitting={submitting}
        planQuery={planQuery}
        replacementQuery={replacementQuery}
        replacesMissionId={replacesMissionId}
        orderId={orderId}
      />
    </div>
  )
}
