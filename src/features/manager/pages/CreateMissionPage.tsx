import { useEffect, useMemo, useState, type ReactNode } from 'react'

import { ApiError } from '../../../shared/api/httpClient'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../shared/i18n'
import { customerApi, type WeatherForecast } from '../../customer/api/customerApi'
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

type ForecastRow =
  | { date: string; label: string; status: 'loading' }
  | { date: string; label: string; status: 'unavailable' }
  | { date: string; label: string; status: 'error' }
  | { date: string; label: string; status: 'ready'; forecast: WeatherForecast }

const DAY_MS = 86_400_000

function isoDatePart(value?: string | null) {
  if (!value) return ''
  const match = value.match(/\d{4}-\d{2}-\d{2}/)
  return match?.[0] ?? ''
}

function timePart(value?: string | null) {
  if (!value) return ''
  const match = value.match(/T(\d{2}):(\d{2})/)
  return match ? `${match[1]}:${match[2]}` : ''
}

function forecastTimeFromBrief(brief: OrderMissionBrief) {
  const fromTime = timePart(brief.preferredDateFrom)
  if (fromTime) return fromTime
  const normalized = brief.preferredTimeName.toLowerCase()
  if (normalized.includes('chiều') || normalized.includes('afternoon')) return '15:00'
  if (normalized.includes('tối') || normalized.includes('evening')) return '19:00'
  return '08:00'
}

function formatDateLabel(iso: string) {
  return iso.split('-').reverse().join('/')
}

function dateRangeFromBrief(brief: OrderMissionBrief) {
  const start = isoDatePart(brief.preferredDateFrom) || isoDatePart(brief.preferredDate)
  const end = isoDatePart(brief.preferredDateTo) || start
  if (!start) return []
  const startMs = Date.parse(`${start}T00:00:00Z`)
  const endMs = Date.parse(`${end}T00:00:00Z`)
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs < startMs) {
    return [start]
  }
  const dates: string[] = []
  for (let ms = startMs; ms <= endMs; ms += DAY_MS) {
    dates.push(new Date(ms).toISOString().slice(0, 10))
  }
  return dates
}

function suitabilityTone(forecast?: WeatherForecast) {
  const suitability = forecast?.suitability ?? 'GOOD'
  if (suitability === 'POOR') return 'is-poor'
  if (suitability === 'CAUTION') return 'is-caution'
  return 'is-good'
}

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

function toLocalInput(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

function formatLocalInput(value: string) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

function WeatherGlyph({ code }: { code?: number }) {
  const rainy = code != null && ((code >= 51 && code <= 67) || (code >= 80 && code <= 82))
  const stormy = code != null && code >= 95
  const cloudy = code === 2 || code === 3 || code === 45 || code === 48 || rainy || stormy
  const sunny = !cloudy || code === 2
  return (
    <svg viewBox="0 0 32 32" width="32" height="32" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {sunny ? (
        <g stroke="#f59e0b">
          <circle cx={cloudy ? 11 : 16} cy={cloudy ? 11 : 16} r="5" />
          {!cloudy ? <path d="M16 3v3M16 26v3M3 16h3M26 16h3M6.8 6.8l2.1 2.1M23.1 23.1l2.1 2.1M6.8 25.2l2.1-2.1M23.1 8.9l2.1-2.1" /> : null}
        </g>
      ) : null}
      {cloudy ? (
        <path stroke="#64748b" d="M10 24h13a5 5 0 0 0 .6-9.96A7 7 0 0 0 10 15a4.5 4.5 0 0 0 0 9z" />
      ) : null}
      {rainy ? <path stroke="#3b82f6" d="M12 27l-1 2M17 27l-1 2M22 27l-1 2" /> : null}
      {stormy ? <path stroke="#eab308" d="M17 20l-3 5h4l-2 4" /> : null}
    </svg>
  )
}

function weatherMetric(value: number | undefined, suffix: string) {
  return value == null ? '–' : `${Math.round(value)}${suffix}`
}

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
  const fillFromCustomer = () => {
    const first = dateRangeFromBrief(brief)[0]
    if (!first) return
    const start = new Date(`${first}T${forecastTimeFromBrief(brief)}`)
    if (Number.isNaN(start.getTime())) return
    setScheduledStart(toLocalInput(start))
    setScheduledEnd(toLocalInput(new Date(start.getTime() + 60 * 60 * 1000)))
    setSubmit({ kind: 'idle' })
  }

  const forecastDates = useMemo(() => dateRangeFromBrief(brief), [brief])
  const forecastTime = useMemo(() => forecastTimeFromBrief(brief), [brief])
  const [forecastRows, setForecastRows] = useState<ForecastRow[]>(() =>
    forecastDates.map((date) => ({ date, label: formatDateLabel(date), status: 'loading' })),
  )

  useEffect(() => {
    if (!brief.center || forecastDates.length === 0) {
      setForecastRows([])
      return
    }
    let cancelled = false
    setForecastRows(
      forecastDates.map((date) => ({ date, label: formatDateLabel(date), status: 'loading' })),
    )
    Promise.all(
      forecastDates.map(async (date): Promise<ForecastRow> => {
        try {
          const forecast = await customerApi.getWeatherForecast({
            latitude: brief.center!.lat,
            longitude: brief.center!.lon,
            date,
            time: forecastTime,
          })
          return forecast.status === 'AVAILABLE'
            ? { date, label: formatDateLabel(date), status: 'ready', forecast }
            : { date, label: formatDateLabel(date), status: 'unavailable' }
        } catch {
          return { date, label: formatDateLabel(date), status: 'error' }
        }
      }),
    ).then((rows) => {
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
                <OrderIcon name="info" size={18} />
                {t.weatherForecastTitle}
              </span>
              <span className="odm-or-pill odm-or-pill-blue">
                {t.weatherForecastTime(forecastTime)}
              </span>
            </header>
            <div className="odm-or-card-body">
              <p className="odm-or-muted odm-or-hint">
                {t.weatherForecastHint}
              </p>
              {!brief.center ? (
                <div className="odm-or-weather-empty">{t.weatherNoLocation}</div>
              ) : forecastRows.length === 0 ? (
                <div className="odm-or-weather-empty">{t.weatherNoDates}</div>
              ) : (
                <div className="odm-or-weather-list">
                  {forecastRows.map((row) => (
                    <div
                      key={row.date}
                      className={`odm-or-weather-row ${row.status === 'ready' ? suitabilityTone(row.forecast) : ''}`}
                    >
                      <div className="odm-or-weather-main">
                        <div className="odm-or-weather-top">
                          <div className="odm-or-weather-date">{row.label}</div>
                          <span className="odm-or-weather-badge">
                            {row.status === 'ready'
                              ? t.weatherSuitability[row.forecast.suitability ?? 'GOOD']
                              : row.status === 'loading'
                                ? t.weatherChecking
                                : t.weatherNotReady}
                          </span>
                        </div>
                        {row.status === 'ready' ? (
                          <>
                            <div className="odm-or-weather-hero">
                              <WeatherGlyph code={row.forecast.weatherCode} />
                              <span className="odm-or-weather-label">
                                {row.forecast.weatherLabel || t.weatherUnknown}
                              </span>
                            </div>
                            <div className="odm-or-weather-metrics">
                              <div className="odm-or-weather-metric">
                                <span className="odm-or-weather-metric-label">{t.weatherTemperatureLabel}</span>
                                <span className="odm-or-weather-metric-value">{weatherMetric(row.forecast.temperatureC, '°C')}</span>
                              </div>
                              <div className="odm-or-weather-metric">
                                <span className="odm-or-weather-metric-label">{t.weatherRainLabel}</span>
                                <span className="odm-or-weather-metric-value">{weatherMetric(row.forecast.precipitationProbabilityPercent, '%')}</span>
                              </div>
                              <div className="odm-or-weather-metric">
                                <span className="odm-or-weather-metric-label">{t.weatherWindLabel}</span>
                                <span className="odm-or-weather-metric-value">{weatherMetric(row.forecast.windSpeedKmh, ' km/h')}</span>
                              </div>
                              <div className="odm-or-weather-metric">
                                <span className="odm-or-weather-metric-label">{t.weatherHumidityLabel}</span>
                                <span className="odm-or-weather-metric-value">{weatherMetric(row.forecast.relativeHumidityPercent, '%')}</span>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="odm-or-weather-desc">
                            {row.status === 'loading'
                              ? t.weatherLoading
                              : row.status === 'unavailable'
                                ? t.weatherUnavailable
                                : t.weatherError}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
              <p className="odm-or-muted odm-or-hint">
                {t.flightScheduleHint}
              </p>
              {forecastRows.length > 0 ? (
                <button type="button" className="odm-or-quickfill" onClick={fillFromCustomer}>
                  {t.fillFromCustomer}
                </button>
              ) : null}
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
              {scheduledStart && scheduledEnd ? (
                <p className="odm-or-schedule-summary">
                  {t.scheduleSummary(formatLocalInput(scheduledStart), formatLocalInput(scheduledEnd))}
                </p>
              ) : null}
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
