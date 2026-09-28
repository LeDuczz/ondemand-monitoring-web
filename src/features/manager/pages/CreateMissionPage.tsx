import { useMemo, useState } from 'react'

import { ApiError } from '../../../shared/api/httpClient'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../shared/i18n'
import { ordersApi } from '../api/ordersApi'
import { missionsApi } from '../api/missionsApi'
import { parseMediaLabels } from '../lib/parseMediaLabel'
import { estimatePlanDuration } from '../lib/planDuration'
import { generateWaypoints, type Waypoint } from '../lib/waypoints'
import { managerHref } from '../routes'
import type { OrderMissionBrief } from '../types/orders'
import type { PlanType } from '../types/missions'
import { createMissionPageMessages } from './CreateMissionPage.messages'
import '../manager.css'

/**
 * MNG-04 "Tạo mission" — create-mission form for an already-APPROVED order.
 *
 * Deviation from evd/design/MNG-04.dc.html: that prototype's only
 * implemented states are a list of *other* orders, a loading skeleton, and
 * the 422 flight-plan-generation-failure error. Staff only needs to choose
 * the actual schedule here; the hidden default flight plan keeps the create
 * API valid, then the flow continues to drone/staff assignment.
 */
export function CreateMissionPage({
  orderId,
  initialBrief,
  now: nowProp,
}: {
  orderId: string
  initialBrief?: OrderMissionBrief
  now?: Date
}) {
  const [now] = useState(() => nowProp ?? new Date())
  const briefQuery = useApiQuery(
    (signal) =>
      initialBrief
        ? Promise.resolve(initialBrief)
        : ordersApi.getOrderForMission(orderId, signal),
    [orderId, initialBrief],
  )

  if (briefQuery.loading) return <CreateMissionSkeleton />
  if (briefQuery.error || !briefQuery.data) {
    return <CreateMissionErrorState error={briefQuery.error} />
  }

  return (
    <CreateMissionForm orderId={orderId} brief={briefQuery.data} now={now} />
  )
}

function CreateMissionSkeleton() {
  const { t } = useI18n(createMissionPageMessages)
  return (
    <div className="odm-mgr-dash" aria-busy="true" aria-live="polite">
      <span className="odm-sk" style={{ width: '100%', height: 100 }} />
      <span
        className="odm-sk"
        style={{ width: '100%', height: 240, marginTop: 14 }}
      />
      <span
        className="odm-sk"
        style={{ width: '100%', height: 300, marginTop: 14 }}
      />
      <span className="odm-visually-hidden">{t.loading}</span>
    </div>
  )
}

function CreateMissionErrorState({ error }: { error: unknown }) {
  const { t } = useI18n(createMissionPageMessages)
  const debugLine =
    error instanceof ApiError
      ? `${error.method} ${error.path}${error.status ? ` · ${error.status}` : ''}`
      : 'GET /orders/{id}/mission-brief'
  return (
    <div className="odm-mgr-dash">
      <div className="odm-card">
        <div className="odm-mgr-review-error">
          <div className="odm-mgr-review-error-icon" aria-hidden="true">
            !
          </div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>{t.loadError}</div>
          <div
            className="odm-mono"
            style={{ fontSize: 11.5, color: 'var(--tx3)' }}
          >
            {debugLine}
          </div>
          <a
            className="odm-btn odm-btn-p"
            href={managerHref({ screen: 'orderQueue' })}
          >
            {t.backToQueue}
          </a>
        </div>
      </div>
    </div>
  )
}

type SubmitState =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'planFailed'; message: string }
  | { kind: 'validationFailed'; message: string }

function CreateMissionForm({
  orderId,
  brief,
  now,
}: {
  orderId: string
  brief: OrderMissionBrief
  now: Date
}) {
  const { t } = useI18n(createMissionPageMessages)
  const center = brief.center ?? { lat: 0, lon: 0 }
  void now

  const planType: PlanType = 'ORBIT'
  const altitudeM = 60
  const speedMs = 8
  const radiusM = brief.radiusM ?? 200
  const [scheduledStart, setScheduledStart] = useState('')
  const [scheduledEnd, setScheduledEnd] = useState('')
  const waypoints = useMemo<Waypoint[]>(
    () => generateWaypoints({ planType, center, radiusM, altitudeM }),
    [planType, center, radiusM, altitudeM],
  )
  const [submit, setSubmit] = useState<SubmitState>({ kind: 'idle' })
  const [navigateTo, setNavigateTo] = useState<string | null>(null)

  const mediaReqs = useMemo(
    () => parseMediaLabels((brief.mediaRequirements ?? []).map((r) => r.label)),
    [brief.mediaRequirements],
  )
  const duration = useMemo(
    () =>
      estimatePlanDuration(waypoints, speedMs, mediaReqs, {
        photoIntervalSec: 3,
      }),
    [waypoints, speedMs, mediaReqs],
  )

  if (navigateTo) {
    window.location.hash = navigateTo
    return null
  }

  async function handleSubmit() {
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
      const mission = await missionsApi.createMission(orderId, {
        scheduledStart: startDate.toISOString(),
        scheduledEnd: endDate.toISOString(),
        flightPlan: {
          planType,
          centerLat: center.lat,
          centerLon: center.lon,
          radiusM,
          altitudeM,
          speedMs,
          estimatedDurationSec: Math.round(duration.estimatedDurationSec),
          generatedBy: 'SYSTEM',
        },
        waypoints,
      })
      setNavigateTo(
        managerHref({ screen: 'missionDispatch', missionId: mission.id }),
      )
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        setSubmit({
          kind: 'planFailed',
          message: err.message || t.planGenerationFailed,
        })
        return
      }
      setSubmit({
        kind: 'validationFailed',
        message: err instanceof ApiError ? err.message : t.createFailed,
      })
    }
  }

  if (submit.kind === 'planFailed') {
    return (
      <div className="odm-mgr-dash">
        <div className="odm-card">
          <div className="odm-mgr-review-error">
            <div className="odm-mgr-review-error-icon" aria-hidden="true">
              !
            </div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>
              {t.planFailedTitle}
            </div>
            <div
              style={{ color: 'var(--tx3)', maxWidth: 420, lineHeight: 1.5 }}
            >
              {t.planFailedBody}
            </div>
            <div
              className="odm-mono"
              style={{
                fontSize: 11.5,
                color: 'var(--tx3)',
                background: 'var(--sf3)',
                padding: '3px 8px',
                borderRadius: 5,
              }}
            >
              POST /orders/{'{id}'}/missions · 422 FLIGHT_PLAN_GENERATION_FAILED
            </div>
            <div style={{ marginTop: 6, display: 'flex', gap: 8 }}>
              <button
                type="button"
                className="odm-btn odm-btn-p"
                onClick={() => setSubmit({ kind: 'idle' })}
              >
                {t.retry}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="odm-mgr-dash">
      <div className="odm-mgr-dash-head">
        <div>
          <h1 className="odm-mgr-dash-title">{t.title}</h1>
          <div className="odm-mgr-dash-date">
            {t.fromOrder(brief.code, brief.serviceName, brief.customerFullName)}
          </div>
        </div>
      </div>

      <div className="odm-mgr-mission-grid">
        <div className="odm-mgr-review-col">
          <div className="odm-card">
            <div className="odm-card-header">{t.customerTimeWindow}</div>
            <div
              className="odm-card-body"
              style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
            >
              <div style={{ fontWeight: 700 }}>
                {t.customerDeadlineValue(
                  brief.preferredDate,
                  brief.preferredTimeName,
                )}
              </div>
              <div className="odm-mgr-review-hint">
                {t.customerTimeWindowHint}
              </div>
            </div>
          </div>

          <div className="odm-card">
            <div className="odm-card-header">{t.flightSchedule}</div>
            <div
              className="odm-card-body"
              style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
            >
              <div className="odm-mgr-review-hint">{t.flightScheduleHint}</div>
              <div className="odm-mgr-mission-form-row">
                <label style={{ flex: 1 }}>
                  <span className="odm-mgr-modal-label">{t.start}</span>
                  <input
                    className="odm-inp"
                    type="datetime-local"
                    value={scheduledStart}
                    onChange={(e) => setScheduledStart(e.target.value)}
                  />
                </label>
                <label style={{ flex: 1 }}>
                  <span className="odm-mgr-modal-label">{t.end}</span>
                  <input
                    className="odm-inp"
                    type="datetime-local"
                    value={scheduledEnd}
                    onChange={(e) => setScheduledEnd(e.target.value)}
                  />
                </label>
              </div>
            </div>
          </div>

        </div>
      </div>

      {submit.kind === 'validationFailed' ? (
        <div className="odm-mgr-modal-error" style={{ marginTop: 8 }}>
          {submit.message}
        </div>
      ) : null}

      <div className="odm-mgr-review-actionbar">
        <button
          type="button"
          className="odm-btn odm-btn-ok odm-btn-lg"
          onClick={handleSubmit}
          disabled={submit.kind === 'submitting'}
        >
          {t.createMission}
        </button>
      </div>
    </div>
  )
}
