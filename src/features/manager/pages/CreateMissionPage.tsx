import { useEffect, useMemo, useState } from 'react'

import { ApiError } from '../../../shared/api/httpClient'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { ordersApi } from '../api/ordersApi'
import { missionsApi } from '../api/missionsApi'
import { SERVICE_MAX_ALTITUDE_M, NO_FLY_CEILING_M } from '../lib/missionPolicy'
import { parseMediaLabels } from '../lib/parseMediaLabel'
import { ceilingWarnings, estimatePlanDuration } from '../lib/planDuration'
import { prefillWindow } from '../lib/prefillWindow'
import { generateWaypoints, type Waypoint } from '../lib/waypoints'
import { managerHref } from '../routes'
import type { OrderMissionBrief } from '../types/orders'
import type { PlanType } from '../types/missions'
import '../manager.css'

/**
 * MNG-04 "Tạo mission" — create-mission form for an already-APPROVED order.
 *
 * Deviation from evd/design/MNG-04.dc.html: that prototype's only
 * implemented states are a list of *other* orders, a loading skeleton, and
 * the 422 flight-plan-generation-failure error — it never renders the
 * actual create-mission form (plan type / altitude / waypoint table /
 * preview) described in the P5 task brief; there is no markup to copy the
 * form layout from. This page implements the form from the brief's textual
 * spec (§B3 MNG-04, §C1, §A6) instead, and keeps the design's 422 state
 * copy verbatim. See evd/P5-manager-mission-dispatch.md for the full note.
 */
export function CreateMissionPage({
  orderId,
  now: nowProp,
}: {
  orderId: string
  now?: Date
}) {
  const [now] = useState(() => nowProp ?? new Date())
  const briefQuery = useApiQuery(
    (signal) => ordersApi.getOrderForMission(orderId, signal),
    [orderId],
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
      <span className="odm-visually-hidden">Đang tải…</span>
    </div>
  )
}

function CreateMissionErrorState({ error }: { error: unknown }) {
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
          <div style={{ fontSize: 15, fontWeight: 600 }}>
            Không tải được đơn để tạo mission
          </div>
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
            Về hàng đợi
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
  const center = brief.center ?? { lat: 0, lon: 0 }
  const prefill = useMemo(
    () =>
      prefillWindow(
        brief.preferredDate,
        brief.preferredTimeName,
        now.getFullYear(),
      ),
    [brief.preferredDate, brief.preferredTimeName, now],
  )

  const [planType, setPlanType] = useState<PlanType>('ORBIT')
  const [altitudeM, setAltitudeM] = useState(60)
  const [speedMs, setSpeedMs] = useState(8)
  const [radiusM, setRadiusM] = useState(brief.radiusM ?? 200)
  const [scheduledStart, setScheduledStart] = useState(
    prefill?.scheduledStart ?? '',
  )
  const [scheduledEnd, setScheduledEnd] = useState(prefill?.scheduledEnd ?? '')
  const [manualMode, setManualMode] = useState(false)
  const [waypoints, setWaypoints] = useState<Waypoint[]>(() =>
    generateWaypoints({ planType, center, radiusM, altitudeM }),
  )
  const [submit, setSubmit] = useState<SubmitState>({ kind: 'idle' })
  const [navigateTo, setNavigateTo] = useState<string | null>(null)

  // `center` comes from `brief`, which is stable for the lifetime of this
  // component (keyed by `orderId`), so it's intentionally left out of the
  // dependency list below — only the form inputs should retrigger
  // regeneration.
  const centerLat = center.lat
  const centerLon = center.lon
  useEffect(() => {
    if (manualMode) return
    setWaypoints(
      generateWaypoints({
        planType,
        center: { lat: centerLat, lon: centerLon },
        radiusM,
        altitudeM,
      }),
    )
  }, [planType, radiusM, altitudeM, manualMode, centerLat, centerLon])

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
  const warnings = useMemo(
    () => ceilingWarnings(altitudeM, SERVICE_MAX_ALTITUDE_M, NO_FLY_CEILING_M),
    [altitudeM],
  )

  if (navigateTo) {
    window.location.hash = navigateTo
    return null
  }

  async function handleSubmit() {
    if (!scheduledStart || !scheduledEnd) {
      setSubmit({
        kind: 'validationFailed',
        message: 'Thời gian bắt đầu/kết thúc là bắt buộc.',
      })
      return
    }
    setSubmit({ kind: 'submitting' })
    try {
      const mission = await missionsApi.createMission(orderId, {
        scheduledStart: new Date(scheduledStart).toISOString(),
        scheduledEnd: new Date(scheduledEnd).toISOString(),
        flightPlan: {
          planType,
          centerLat: center.lat,
          centerLon: center.lon,
          radiusM,
          altitudeM,
          speedMs,
          estimatedDurationSec: Math.round(duration.estimatedDurationSec),
          generatedBy: manualMode ? 'MANUAL' : 'SYSTEM',
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
          message:
            err.message ||
            'Dịch vụ tạo đường bay báo lỗi cho khu vực này. Bạn có thể nhập waypoint thủ công.',
        })
        return
      }
      setSubmit({
        kind: 'validationFailed',
        message:
          err instanceof ApiError
            ? err.message
            : 'Tạo mission thất bại, thử lại.',
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
              Không sinh được flight plan
            </div>
            <div
              style={{ color: 'var(--tx3)', maxWidth: 420, lineHeight: 1.5 }}
            >
              Dịch vụ tạo đường bay báo lỗi cho khu vực này. Bạn có thể nhập
              waypoint thủ công.
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
                Thử lại
              </button>
              <button
                type="button"
                className="odm-btn"
                onClick={() => {
                  setManualMode(true)
                  setSubmit({ kind: 'idle' })
                }}
              >
                Nhập waypoint thủ công
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
          <h1 className="odm-mgr-dash-title">Tạo mission</h1>
          <div className="odm-mgr-dash-date">
            Từ đơn {brief.code} · {brief.serviceName} · {brief.customerFullName}
          </div>
        </div>
      </div>

      <div className="odm-mgr-mission-grid">
        <div className="odm-mgr-review-col">
          <div className="odm-card">
            <div className="odm-card-header">Lịch bay</div>
            <div className="odm-card-body odm-mgr-mission-form-row">
              <label style={{ flex: 1 }}>
                <span className="odm-mgr-modal-label">Bắt đầu</span>
                <input
                  className="odm-inp"
                  type="datetime-local"
                  value={scheduledStart}
                  onChange={(e) => setScheduledStart(e.target.value)}
                />
              </label>
              <label style={{ flex: 1 }}>
                <span className="odm-mgr-modal-label">Kết thúc</span>
                <input
                  className="odm-inp"
                  type="datetime-local"
                  value={scheduledEnd}
                  onChange={(e) => setScheduledEnd(e.target.value)}
                />
              </label>
            </div>
          </div>

          <div className="odm-card">
            <div className="odm-card-header">Flight plan</div>
            <div
              className="odm-card-body"
              style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
            >
              <div>
                <span className="odm-mgr-modal-label">Kiểu bay</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  {(['ORBIT', 'GRID', 'POINT'] as PlanType[]).map((pt) => (
                    <button
                      key={pt}
                      type="button"
                      className={
                        pt === planType
                          ? 'odm-btn odm-btn-p odm-btn-sm'
                          : 'odm-btn odm-btn-sm'
                      }
                      onClick={() => setPlanType(pt)}
                    >
                      {pt}
                    </button>
                  ))}
                </div>
              </div>
              <div className="odm-mgr-mission-form-row">
                <label style={{ flex: 1 }}>
                  <span className="odm-mgr-modal-label">Bán kính (m)</span>
                  <input
                    className="odm-inp"
                    type="number"
                    value={radiusM}
                    onChange={(e) => setRadiusM(Number(e.target.value))}
                  />
                </label>
                <label style={{ flex: 1 }}>
                  <span className="odm-mgr-modal-label">Độ cao (m)</span>
                  <input
                    className="odm-inp"
                    type="number"
                    value={altitudeM}
                    onChange={(e) => setAltitudeM(Number(e.target.value))}
                  />
                </label>
                <label style={{ flex: 1 }}>
                  <span className="odm-mgr-modal-label">Tốc độ (m/s)</span>
                  <input
                    className="odm-inp"
                    type="number"
                    value={speedMs}
                    onChange={(e) => setSpeedMs(Number(e.target.value))}
                  />
                </label>
              </div>
              {warnings.map((w) => (
                <div key={w.code} className="odm-mgr-modal-error">
                  {w.message}
                </div>
              ))}
              <div className="odm-mgr-review-hint">
                Ước tính thời lượng:{' '}
                {Math.round(duration.estimatedDurationSec / 60)} phút (T_path{' '}
                {Math.round(duration.tPathSec)}s · T_capture{' '}
                {Math.round(duration.tCaptureSec)}s)
              </div>
              <MissionPathPreview
                center={center}
                radiusM={radiusM}
                waypoints={waypoints}
              />
            </div>
          </div>

          <WaypointTable
            waypoints={waypoints}
            editable={manualMode}
            onChange={setWaypoints}
          />
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
          Tạo mission
        </button>
      </div>
    </div>
  )
}

function project(
  center: { lat: number; lon: number },
  point: { lat: number; lon: number },
  pxPerMeter: number,
) {
  const dLatM = (point.lat - center.lat) * 111_320
  const dLonM =
    (point.lon - center.lon) * 111_320 * Math.cos((center.lat * Math.PI) / 180)
  return { x: dLonM * pxPerMeter, y: -dLatM * pxPerMeter }
}

function MissionPathPreview({
  center,
  radiusM,
  waypoints,
}: {
  center: { lat: number; lon: number }
  radiusM: number
  waypoints: Waypoint[]
}) {
  const size = 240
  const half = size / 2
  const pxPerMeter = radiusM > 0 ? (half - 20) / radiusM : 0.1
  const pathD = waypoints
    .map((wp, i) => {
      const p = project(center, wp, pxPerMeter)
      return `${i === 0 ? 'M' : 'L'}${(half + p.x).toFixed(1)} ${(half + p.y).toFixed(1)}`
    })
    .join(' ')

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label="Xem trước đường bay"
      className="odm-mgr-mission-preview"
    >
      <rect width={size} height={size} className="odm-mgr-map-bg" />
      <circle
        cx={half}
        cy={half}
        r={radiusM * pxPerMeter}
        className="odm-mgr-map-radius"
      />
      {waypoints.length > 1 ? (
        <path
          d={pathD}
          fill="none"
          stroke="var(--blue-solid)"
          strokeWidth={2}
        />
      ) : null}
      <circle cx={half} cy={half} r={4} className="odm-mgr-map-pin-dot" />
    </svg>
  )
}

function WaypointTable({
  waypoints,
  editable,
  onChange,
}: {
  waypoints: Waypoint[]
  editable: boolean
  onChange: (next: Waypoint[]) => void
}) {
  function updateRow(index: number, patch: Partial<Waypoint>) {
    onChange(waypoints.map((wp, i) => (i === index ? { ...wp, ...patch } : wp)))
  }
  function removeRow(index: number) {
    onChange(waypoints.filter((_, i) => i !== index))
  }
  function addRow() {
    const last = waypoints[waypoints.length - 1]
    onChange([
      ...waypoints,
      {
        seq: (last?.seq ?? 0) + 1,
        action: 'GOTO',
        lat: last?.lat ?? 0,
        lon: last?.lon ?? 0,
        altM: last?.altM ?? 0,
      },
    ])
  }

  return (
    <div className="odm-card">
      <div className="odm-card-header">
        <span>Waypoint ({waypoints.length})</span>
        {editable ? (
          <button type="button" className="odm-btn odm-btn-sm" onClick={addRow}>
            Thêm waypoint
          </button>
        ) : null}
      </div>
      <div className="odm-card-body" style={{ overflowX: 'auto' }}>
        <table className="odm-mgr-mission-wp-table">
          <thead>
            <tr>
              <th>Seq</th>
              <th>Action</th>
              <th>Lat</th>
              <th>Lon</th>
              <th>Alt (m)</th>
              {editable ? <th /> : null}
            </tr>
          </thead>
          <tbody>
            {waypoints.map((wp, i) => (
              <tr key={i}>
                <td className="odm-tn">{wp.seq}</td>
                <td>
                  {editable ? (
                    <input
                      className="odm-inp"
                      value={wp.action}
                      onChange={(e) =>
                        updateRow(i, {
                          action: e.target.value as Waypoint['action'],
                        })
                      }
                    />
                  ) : (
                    wp.action
                  )}
                </td>
                <td className="odm-mono">
                  {editable ? (
                    <input
                      className="odm-inp"
                      type="number"
                      value={wp.lat}
                      onChange={(e) =>
                        updateRow(i, { lat: Number(e.target.value) })
                      }
                    />
                  ) : (
                    wp.lat.toFixed(6)
                  )}
                </td>
                <td className="odm-mono">
                  {editable ? (
                    <input
                      className="odm-inp"
                      type="number"
                      value={wp.lon}
                      onChange={(e) =>
                        updateRow(i, { lon: Number(e.target.value) })
                      }
                    />
                  ) : (
                    wp.lon.toFixed(6)
                  )}
                </td>
                <td className="odm-tn">
                  {editable ? (
                    <input
                      className="odm-inp"
                      type="number"
                      value={wp.altM}
                      onChange={(e) =>
                        updateRow(i, { altM: Number(e.target.value) })
                      }
                    />
                  ) : (
                    wp.altM
                  )}
                </td>
                {editable ? (
                  <td>
                    <button
                      type="button"
                      className="odm-btn odm-btn-sm odm-btn-gh"
                      onClick={() => removeRow(i)}
                      aria-label={`Xoá waypoint ${wp.seq}`}
                    >
                      ×
                    </button>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
