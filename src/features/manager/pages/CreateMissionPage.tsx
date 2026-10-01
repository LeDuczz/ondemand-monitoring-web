import { useState, type ReactNode } from 'react'

import { ApiError } from '../../../shared/api/httpClient'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../shared/i18n'
import { ordersApi } from '../api/ordersApi'
import { missionsApi } from '../api/missionsApi'
import { OrderIcon, type OrderIconName } from '../components/orderReview/OrderIcon'
import { formatOrderCode, humanizeMediaRequirement } from '../components/orderReview/format'
import { OrderWorkflowStepper } from '../components/OrderWorkflowStepper'
import { preferredLabel } from '../lib/viLabels'
import { managerHref } from '../routes'
import type { OrderMissionBrief } from '../types/orders'
import { createMissionPageMessages } from './CreateMissionPage.messages'
import { orderReviewPageMessages } from './OrderReviewPage.messages'
import '../manager.css'

/**
 * MNG-04 "Tạo nhiệm vụ" — create-mission form for an already-APPROVED order.
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
    <div className="odm-or" aria-busy="true" aria-live="polite">
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
  const { t: reviewT } = useI18n(orderReviewPageMessages)
  const localizeMediaLabel = (label: string) =>
    humanizeMediaRequirement(label, reviewT)
  void now

  const [scheduledStart, setScheduledStart] = useState('')
  const [scheduledEnd, setScheduledEnd] = useState('')
  const [submit, setSubmit] = useState<SubmitState>({ kind: 'idle' })
  const [navigateTo, setNavigateTo] = useState<string | null>(null)

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
      })
      setNavigateTo(
        managerHref({ screen: 'missionSetup', missionId: mission.id }),
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
      <div className="odm-or">
        <OrderWorkflowStepper currentStep={2} />
        <div className="odm-or-card">
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

  const summaryRows: Array<{
    icon: OrderIconName
    label: string
    value: ReactNode
  }> = [
    { icon: 'service', label: t.serviceLabel, value: brief.serviceName },
    { icon: 'user', label: t.customerLabel, value: brief.customerFullName },
    { icon: 'pin', label: t.locationLabel, value: brief.addressText ?? '—' },
    {
      icon: 'radius',
      label: t.radiusLabel,
      value: brief.radiusM != null ? `${brief.radiusM} m` : '—',
    },
  ]
  if (brief.nearestBase) {
    summaryRows.push({
      icon: 'drone',
      label: t.nearestBaseLabel,
      value: brief.nearestBase,
    })
  }

  return (
    <div className="odm-or">
      <div className="odm-or-pagehead">
        <h1 className="odm-or-title">{t.title}</h1>
        <p className="odm-or-subtitle">
          {t.fromOrder(
            formatOrderCode(brief.code),
            brief.serviceName,
            brief.customerFullName,
          )}
        </p>
      </div>

      <OrderWorkflowStepper currentStep={2} />

      <div className="odm-or-grid">
        <div className="odm-or-col">
          <section className="odm-or-card">
            <header className="odm-or-card-head">
              <span className="odm-or-card-title">
                <OrderIcon name="calendar" size={18} />
                {t.customerTimeWindow}
              </span>
            </header>
            <div className="odm-or-card-body">
              <div className="odm-or-bigvalue">
                {preferredLabel(brief.preferredDate, brief.preferredTimeName)}
              </div>
              <p className="odm-or-muted">{t.customerTimeWindowHint}</p>
            </div>
          </section>

          <section className="odm-or-card">
            <header className="odm-or-card-head">
              <span className="odm-or-card-title">
                <OrderIcon name="clock" size={18} />
                {t.flightSchedule}
              </span>
              {durationText ? (
                <span className="odm-or-pill odm-or-pill-blue">
                  {t.durationLabel(durationText)}
                </span>
              ) : null}
            </header>
            <div className="odm-or-card-body">
              <p className="odm-or-muted" style={{ marginTop: 0 }}>
                {t.flightScheduleHint}
              </p>
              <div className="odm-or-form-row">
                <label className="odm-or-field">
                  <span className="odm-or-field-label">{t.start}</span>
                  <input
                    className="odm-or-input"
                    type="datetime-local"
                    value={scheduledStart}
                    onChange={(e) => setScheduledStart(e.target.value)}
                  />
                </label>
                <label className="odm-or-field">
                  <span className="odm-or-field-label">{t.end}</span>
                  <input
                    className="odm-or-input"
                    type="datetime-local"
                    min={scheduledStart || undefined}
                    value={scheduledEnd}
                    onChange={(e) => setScheduledEnd(e.target.value)}
                  />
                </label>
              </div>
              {submit.kind === 'validationFailed' ? (
                <div role="alert" className="odm-or-error">
                  {submit.message}
                </div>
              ) : null}
            </div>
          </section>
        </div>

        <div className="odm-or-col">
          <section className="odm-or-card">
            <header className="odm-or-card-head">
              <span className="odm-or-card-title">
                <OrderIcon name="doc" size={18} />
                {t.orderSummary}
              </span>
            </header>
            <dl className="odm-or-card-body odm-or-summary-list">
              {summaryRows.map((row) => (
                <div key={row.label}>
                  <dt>
                    <OrderIcon name={row.icon} size={16} />
                    {row.label}
                  </dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
              {brief.mediaRequirements && brief.mediaRequirements.length > 0 ? (
                <div>
                  <dt>
                    <OrderIcon name="media" size={16} />
                    {t.mediaLabel}
                  </dt>
                  <dd className="odm-or-info-lines">
                    {brief.mediaRequirements.map((req, i) => (
                      <span key={i}>{localizeMediaLabel(req.label)}</span>
                    ))}
                  </dd>
                </div>
              ) : null}
            </dl>
          </section>
        </div>
      </div>

      <div className="odm-or-actionbar">
        <div className="odm-or-actionbar-hint">
          <span className="odm-or-actionbar-hint-icon">
            <OrderIcon name="info" size={18} />
          </span>
          <span>{t.actionHint}</span>
        </div>
        <div className="odm-or-actionbar-actions">
          <a
            className="odm-or-btn odm-or-btn-ghost"
            href={managerHref({ screen: 'orderQueue' })}
          >
            {t.backToOrders}
          </a>
          <button
            type="button"
            className="odm-or-btn odm-or-btn-primary"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? t.creating : t.createMission}
            <OrderIcon name="chevron-right" size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
