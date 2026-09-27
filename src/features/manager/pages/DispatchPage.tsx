import { useEffect, useState } from 'react'
import { env } from '../../../config/env'
import { LiveDispatchPage } from './LiveDispatchPage'

import { ApiError } from '../../../shared/api/httpClient'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../shared/i18n'
import {
  getMissionStatusLabel,
  missionStatusTone,
} from '../../../shared/lib/statusTone'
import { StatusBadge } from '../../../shared/components/odm/StatusBadge'
import { missionsApi } from '../api/missionsApi'
import { managerHref } from '../routes'
import type {
  DroneCandidate,
  Mission,
  OperatorCandidate,
  ResourceSuggestions,
} from '../types/missions'
import { dispatchPageMessages } from './DispatchPage.messages'
import '../manager.css'

/**
 * MNG-05 "Phân công nguồn lực" (dispatch). Route
 * #portal/staff/missions/:missionId/dispatch. Layout and copy for the
 * default / xung đột lịch / không đủ nguồn lực / đang tính điểm / lỗi
 * states are copied from evd/design/MNG-05.dc.html. Deviation: the
 * design's day timeline is a pixel-positioned Gantt bar chart; this page
 * renders the same booking data as a simple per-resource list instead
 * (no exact start/end times are sourced for most of the bookings shown in
 * the design, only DRN-04's conflict) — see evd/P5-manager-mission-dispatch.md.
 */
export function DispatchPage({ missionId }: { missionId: string }) {
  return env.useMockApi || import.meta.env.MODE === 'test' ? (
    <MockDispatchPage missionId={missionId} />
  ) : (
    <LiveDispatchPage missionId={missionId} />
  )
}

function MockDispatchPage({ missionId }: { missionId: string }) {
  const missionQuery = useApiQuery(
    (signal) => missionsApi.getMission(missionId, signal),
    [missionId],
  )
  const suggestionsQuery = useApiQuery(
    (signal) => missionsApi.getResourceSuggestions(missionId, { signal }),
    [missionId],
  )

  if (missionQuery.loading || suggestionsQuery.loading) {
    return <DispatchLoading />
  }

  if (missionQuery.error || !missionQuery.data) {
    return (
      <DispatchErrorState
        error={missionQuery.error}
        onRetry={missionQuery.reload}
      />
    )
  }

  if (suggestionsQuery.error) {
    return (
      <SuggestionsErrorState
        error={suggestionsQuery.error}
        onRetry={suggestionsQuery.reload}
      />
    )
  }

  if (!suggestionsQuery.data) return null

  return (
    <DispatchBody
      mission={missionQuery.data}
      suggestions={suggestionsQuery.data}
      onMissionChanged={missionQuery.reload}
    />
  )
}

function DispatchLoading() {
  const { t } = useI18n(dispatchPageMessages)
  return (
    <div className="odm-mgr-dash" aria-busy="true" aria-live="polite">
      <span className="odm-sk" style={{ width: '100%', height: 90 }} />
      <div className="odm-mgr-dispatch-grid" style={{ marginTop: 14 }}>
        <span className="odm-sk" style={{ width: '100%', height: 400 }} />
        <span className="odm-sk" style={{ width: '100%', height: 400 }} />
      </div>
      <span className="odm-visually-hidden">{t.scoringLoading}</span>
    </div>
  )
}

function DispatchErrorState({
  error,
  onRetry,
}: {
  error: unknown
  onRetry: () => void
}) {
  const { t } = useI18n(dispatchPageMessages)
  const debugLine =
    error instanceof ApiError
      ? `${error.method} ${error.path}${error.status ? ` · ${error.status}` : ''}`
      : 'GET /missions/{id}'
  return (
    <div className="odm-mgr-dash">
      <div className="odm-card">
        <div className="odm-mgr-review-error">
          <div className="odm-mgr-review-error-icon" aria-hidden="true">
            !
          </div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>
            {t.loadMissionError}
          </div>
          <div
            className="odm-mono"
            style={{ fontSize: 11.5, color: 'var(--tx3)' }}
          >
            {debugLine}
          </div>
          <button type="button" className="odm-btn odm-btn-p" onClick={onRetry}>
            {t.retry}
          </button>
        </div>
      </div>
    </div>
  )
}

function SuggestionsErrorState({
  error,
  onRetry,
}: {
  error: unknown
  onRetry: () => void
}) {
  const { t } = useI18n(dispatchPageMessages)
  const debugLine =
    error instanceof ApiError
      ? `${error.method} ${error.path}${error.status ? ` · ${error.status}` : ''}`
      : 'GET /missions/{id}/resource-suggestions · 504'
  return (
    <div className="odm-mgr-dash">
      <div className="odm-card">
        <div className="odm-mgr-review-error">
          <div className="odm-mgr-review-error-icon" aria-hidden="true">
            !
          </div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>
            {t.suggestionsErrorTitle}
          </div>
          <div style={{ color: 'var(--tx3)', maxWidth: 420, lineHeight: 1.5 }}>
            {t.suggestionsErrorBody}
          </div>
          <div
            className="odm-mono"
            style={{ fontSize: 11.5, color: 'var(--tx3)' }}
          >
            {debugLine}
          </div>
          <button type="button" className="odm-btn odm-btn-p" onClick={onRetry}>
            {t.retry}
          </button>
        </div>
      </div>
    </div>
  )
}

function ScoreRing({ score }: { score: number }) {
  const { t } = useI18n(dispatchPageMessages)
  const size = 44
  const r = 18
  const circumference = 2 * Math.PI * r
  const offset = circumference * (1 - score / 100)
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="odm-mgr-score-ring"
      role="img"
      aria-label={t.scoreAria(score)}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--sf3)"
        strokeWidth={4}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--blue-solid)"
        strokeWidth={4}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x={size / 2}
        y={size / 2 + 4}
        textAnchor="middle"
        fontSize={13}
        fontWeight={700}
      >
        {score}
      </text>
    </svg>
  )
}

type LockedDrone = {
  candidate: DroneCandidate | null
  code: string
  name: string
  assignmentId: string
}

function DispatchBody({
  mission: initialMission,
  suggestions,
  onMissionChanged,
}: {
  mission: Mission
  suggestions: ResourceSuggestions
  onMissionChanged: () => void
}) {
  const { t, lang } = useI18n(dispatchPageMessages)
  const [mission, setMission] = useState(initialMission)
  // Phase 1: null = drone not yet locked; set = drone locked via API
  const [lockedDrone, setLockedDrone] = useState<LockedDrone | null>(() => {
    if (!initialMission.droneId || !initialMission.droneAssignmentId)
      return null
    const candidate =
      suggestions.topDrones.find((d) => d.code === initialMission.droneId) ??
      null
    return {
      candidate,
      code: initialMission.droneId,
      name: candidate?.name ?? initialMission.droneId,
      assignmentId: initialMission.droneAssignmentId,
    }
  })
  // Phase 2: operator selection
  const [selectedOperator, setSelectedOperator] = useState<string | null>(null)
  const [lockingDrone, setLockingDrone] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [droneError, setDroneError] = useState<string | null>(null)
  const [assignError, setAssignError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [rejectedOpen, setRejectedOpen] = useState(false)
  const [releaseModal, setReleaseModal] = useState(false)

  // Auto-dismiss toast after 4 s
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  const selectedOperatorCandidate = suggestions.topOperators.find(
    (o) => o.code === selectedOperator,
  )

  async function handleLockDrone(droneCode: string) {
    setLockingDrone(true)
    setDroneError(null)
    try {
      const updated = await missionsApi.assignDrone(mission.id, droneCode)
      setMission(updated)
      const candidate =
        suggestions.topDrones.find((d) => d.code === droneCode) ?? null
      setLockedDrone({
        candidate,
        code: droneCode,
        name: candidate?.name ?? droneCode,
        assignmentId: updated.droneAssignmentId ?? '',
      })
    } catch (err) {
      setDroneError(err instanceof ApiError ? err.message : t.cannotSelectDrone)
    } finally {
      setLockingDrone(false)
    }
  }

  async function handleAssignOperator() {
    if (!lockedDrone || !selectedOperator) return
    setAssigning(true)
    setAssignError(null)
    try {
      const updated = await missionsApi.assignOperator(
        mission.id,
        selectedOperator,
      )
      setMission(updated)
      const name = selectedOperatorCandidate?.fullName ?? selectedOperator
      setToast(t.assignSuccess(name))
    } catch (err) {
      if (err instanceof ApiError && err.code === 'SCHEDULE_CONFLICT') {
        setAssignError(err.message)
      } else {
        setAssignError(err instanceof ApiError ? err.message : t.assignFailed)
      }
    } finally {
      setAssigning(false)
    }
  }

  async function handleAutoAssign() {
    const topDrone = suggestions.topDrones[0]
    const topOperator = suggestions.topOperators[0]
    if (!topDrone || !topOperator) return
    // Step 1: lock drone
    setLockingDrone(true)
    setDroneError(null)
    let updated: Mission
    try {
      updated = await missionsApi.assignDrone(mission.id, topDrone.code)
      setMission(updated)
      setLockedDrone({
        candidate: topDrone,
        code: topDrone.code,
        name: topDrone.name,
        assignmentId: updated.droneAssignmentId ?? '',
      })
    } catch (err) {
      setDroneError(err instanceof ApiError ? err.message : t.cannotSelectDrone)
      setLockingDrone(false)
      return
    }
    setLockingDrone(false)
    // Step 2: assign operator
    setAssigning(true)
    setAssignError(null)
    try {
      const afterOp = await missionsApi.assignOperator(
        mission.id,
        topOperator.code,
      )
      setMission(afterOp)
      setSelectedOperator(topOperator.code)
      setToast(t.autoAssignSuccess(topDrone.name, topOperator.fullName))
    } catch (err) {
      if (err instanceof ApiError && err.code === 'SCHEDULE_CONFLICT') {
        setAssignError(err.message)
      } else {
        setAssignError(err instanceof ApiError ? err.message : t.assignFailed)
      }
    } finally {
      setAssigning(false)
    }
  }

  async function handleRelease(reason: string) {
    if (mission.droneAssignmentId) {
      await missionsApi.releaseAssignment(
        mission.id,
        mission.droneAssignmentId,
        reason,
      )
    }
    if (mission.operatorAssignmentId) {
      await missionsApi.releaseAssignment(
        mission.id,
        mission.operatorAssignmentId,
        reason,
      )
    }
    setReleaseModal(false)
    setLockedDrone(null)
    setSelectedOperator(null)
    onMissionChanged()
  }

  const bothAssigned = Boolean(mission.droneId && mission.operatorId)

  return (
    <div className="odm-mgr-dash">
      {/* Toast notification */}
      {toast ? (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 9999,
            background: 'var(--green-solid, #22c55e)',
            color: '#fff',
            borderRadius: 8,
            padding: '12px 20px',
            maxWidth: 420,
            boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
            fontSize: 14,
            fontWeight: 500,
            lineHeight: 1.5,
          }}
        >
          {toast}
        </div>
      ) : null}

      <div className="odm-mgr-dash-head">
        <div>
          <h1 className="odm-mgr-dash-title">{t.title}</h1>
          <div className="odm-mgr-dash-date">{t.subtitle}</div>
        </div>
        <StatusBadge tone={missionStatusTone[mission.status]} size="lg">
          {getMissionStatusLabel(mission.status, lang)}
        </StatusBadge>
      </div>

      <div className="odm-card" style={{ marginBottom: 14 }}>
        <div className="odm-card-header">
          {t.missionHeader(mission.missionCode)}
        </div>
        <div className="odm-card-body odm-mgr-review-location-grid">
          <div>
            <div className="odm-mgr-review-hint">{t.order}</div>
            <div style={{ fontWeight: 600 }}>
              {mission.orderCode} · {t.attempt(mission.attemptNumber)}
            </div>
          </div>
          <div>
            <div className="odm-mgr-review-hint">{t.time}</div>
            <div className="odm-mono" style={{ fontWeight: 600 }}>
              {suggestions.scheduledStart} → {suggestions.scheduledEnd}
            </div>
          </div>
          <div>
            <div className="odm-mgr-review-hint">{t.location}</div>
            <div style={{ fontWeight: 600 }}>
              {suggestions.addressText ?? '—'}
              {suggestions.centerLat != null && suggestions.centerLon != null
                ? ` · ${suggestions.centerLat}, ${suggestions.centerLon}`
                : ''}
              {suggestions.radiusM != null ? t.radius(suggestions.radiusM) : ''}
            </div>
          </div>
          <div>
            <div className="odm-mgr-review-hint">{t.mediaRequirement}</div>
            <div style={{ fontWeight: 600 }}>
              {suggestions.mediaSummary ?? '—'}
            </div>
          </div>
          <div>
            <div className="odm-mgr-review-hint">{t.requiredDuration}</div>
            <div style={{ fontWeight: 600 }}>
              {suggestions.requiredDurationLabel ?? '—'}
            </div>
          </div>
          <div>
            <div className="odm-mgr-review-hint">{t.requiredSensor}</div>
            <div style={{ fontWeight: 600 }}>
              {suggestions.requiredSensor ?? '—'}
            </div>
          </div>
          <div>
            <div className="odm-mgr-review-hint">{t.servingStation}</div>
            <div style={{ fontWeight: 600 }}>
              {suggestions.nearestBase ?? '—'}
            </div>
          </div>
        </div>
      </div>

      {!suggestions.feasible ? (
        <div className="odm-card" style={{ marginBottom: 14 }}>
          <div className="odm-card-body">
            <div style={{ fontWeight: 700, marginBottom: 4 }}>
              {t.noEligibleDrones}
            </div>
            <div style={{ color: 'var(--tx3)', marginBottom: 10 }}>
              {suggestions.explanation}
            </div>
            {suggestions.alternatives.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div
                  className="odm-mgr-review-hint"
                  style={{ fontWeight: 700 }}
                >
                  {t.alternativeDays}
                </div>
                {suggestions.alternatives.map((alt) => (
                  <div key={alt.priority} className="odm-mgr-rejected-row">
                    <span style={{ fontWeight: 700 }}>{alt.label}</span>
                    <span>
                      {alt.dateLabel} · {alt.windowLabel}
                    </span>
                    <span className="odm-tn">
                      {t.dronesFree(alt.eligibleDroneCount)}
                    </span>
                    <span className="odm-tn">
                      {t.operatorsFree(alt.eligibleOperatorCount)}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {droneError ? (
        <div className="odm-mgr-modal-error" style={{ marginBottom: 10 }}>
          {droneError}
        </div>
      ) : null}

      {assignError ? (
        <div className="odm-mgr-modal-error" style={{ marginBottom: 10 }}>
          {assignError}
        </div>
      ) : null}

      {/* ── Bước 1: chọn drone ─────────────────────────────────────────────── */}
      {!lockedDrone ? (
        <div className="odm-card" style={{ marginBottom: 14 }}>
          <div className="odm-card-header">
            {t.step1Choose}
            <span
              style={{ fontWeight: 500, color: 'var(--tx3)', fontSize: 11.5 }}
            >
              {t.topOf(
                suggestions.topDrones.length,
                suggestions.eligibleDroneCount,
              )}
            </span>
          </div>
          {suggestions.topDrones.map((d, i) => (
            <DroneCard
              key={d.code}
              rank={i + 1}
              drone={d}
              locking={lockingDrone}
              onLock={() => handleLockDrone(d.code)}
            />
          ))}
        </div>
      ) : (
        <>
          {/* Locked drone card */}
          <div
            className="odm-card"
            style={{
              marginBottom: 14,
              borderLeft: '3px solid var(--blue-solid)',
            }}
          >
            <div
              className="odm-card-header"
              style={{ color: 'var(--blue-solid)' }}
            >
              {t.step1Done}
            </div>
            {lockedDrone.candidate ? (
              <LockedDroneCard drone={lockedDrone.candidate} />
            ) : (
              <div className="odm-card-body" style={{ fontWeight: 700 }}>
                {lockedDrone.code} · {lockedDrone.name}
              </div>
            )}
          </div>

          {/* ── Bước 2: chọn phi công ──────────────────────────────────────── */}
          <div className="odm-card" style={{ marginBottom: 14 }}>
            <div className="odm-card-header">
              {t.step2Choose}
              <span
                style={{
                  fontWeight: 500,
                  color: 'var(--tx3)',
                  fontSize: 11.5,
                }}
              >
                {t.topOf(
                  suggestions.topOperators.length,
                  suggestions.eligibleOperatorCount,
                )}
              </span>
            </div>
            {suggestions.topOperators.map((o, i) => (
              <OperatorCard
                key={o.code}
                rank={i + 1}
                operator={o}
                selected={selectedOperator === o.code}
                onSelect={() => setSelectedOperator(o.code)}
              />
            ))}
          </div>
        </>
      )}

      <div className="odm-card" style={{ marginTop: 14 }}>
        <button
          type="button"
          className="odm-card-header"
          style={{
            width: '100%',
            border: 0,
            background: 'transparent',
            cursor: 'pointer',
          }}
          onClick={() => setRejectedOpen((v) => !v)}
          aria-expanded={rejectedOpen}
        >
          <span>
            {t.rejectedSummary(
              suggestions.rejected.drones.length,
              suggestions.rejected.operators.length,
            )}
          </span>
          <span>{rejectedOpen ? t.collapse : t.expand}</span>
        </button>
        {rejectedOpen ? (
          <div className="odm-card-body">
            <div style={{ fontWeight: 700, marginBottom: 6 }}>
              {t.rejectedDrones(suggestions.rejected.drones.length)}
            </div>
            {suggestions.rejected.drones.map((d) => (
              <div key={d.code} className="odm-mgr-rejected-row">
                <span className="odm-mono" style={{ fontWeight: 700 }}>
                  {d.code}
                </span>
                <span>: {d.reason}</span>
              </div>
            ))}
            <div style={{ fontWeight: 700, margin: '10px 0 6px' }}>
              {t.rejectedOperators(suggestions.rejected.operators.length)}
            </div>
            {suggestions.rejected.operators.map((o) => (
              <div key={o.name} className="odm-mgr-rejected-row">
                <span style={{ fontWeight: 700 }}>{o.name}</span>
                <span>: {o.reason}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <TimelineCard timeline={suggestions.timeline} />

      <div className="odm-mgr-dispatch-bottombar">
        <span style={{ flex: 1 }} />
        <button
          type="button"
          className="odm-btn"
          onClick={() => setReleaseModal(true)}
          disabled={!bothAssigned}
        >
          {t.releaseAssignment}
        </button>
        {!lockedDrone ? (
          <button
            type="button"
            className="odm-btn"
            onClick={handleAutoAssign}
            disabled={lockingDrone || assigning || !suggestions.feasible}
          >
            {t.autoAssignRank1}
          </button>
        ) : (
          <button
            type="button"
            className="odm-btn odm-btn-ok"
            onClick={handleAssignOperator}
            disabled={!selectedOperator || assigning}
          >
            {assigning ? t.assigning : t.assign}
          </button>
        )}
      </div>

      {releaseModal ? (
        <ReleaseModal
          onClose={() => setReleaseModal(false)}
          onConfirm={handleRelease}
        />
      ) : null}
    </div>
  )
}

function LockedDroneCard({ drone }: { drone: DroneCandidate }) {
  const { t } = useI18n(dispatchPageMessages)
  return (
    <div className="odm-mgr-candidate-card selected">
      <div className="odm-mgr-candidate-head">
        <ScoreRing score={drone.score} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700 }}>
            {drone.code} · {drone.name}
          </div>
          <div style={{ color: 'var(--tx3)', fontSize: 12 }}>
            {drone.serialNumber} · {drone.droneModelName}
          </div>
        </div>
      </div>
      <div className="odm-mgr-candidate-metrics">
        <span>
          {t.candidate.battery} <b className="odm-tn">{drone.batteryPct}%</b>
        </span>
        <span>
          {t.candidate.distanceToStation}{' '}
          <b className="odm-tn">{drone.distanceKm} km</b>
        </span>
        <span>
          {t.candidate.enduranceMargin}{' '}
          <b className="odm-tn">{drone.enduranceMarginPct}%</b>
        </span>
        <span>
          {t.candidate.payload} <b>{drone.payload}</b>
        </span>
        <span>
          {t.candidate.hoursSinceMaintenance}{' '}
          <b className="odm-tn">{drone.hoursSinceMaintenance}h</b>
        </span>
      </div>
      <a
        href={managerHref({ screen: 'drones' })}
        className="odm-btn odm-btn-sm"
      >
        {t.candidate.changeDrone}
      </a>
    </div>
  )
}

function DroneCard({
  rank,
  drone,
  locking,
  onLock,
}: {
  rank: number
  drone: DroneCandidate
  locking: boolean
  onLock: () => void
}) {
  const { t } = useI18n(dispatchPageMessages)
  return (
    <div className="odm-mgr-candidate-card">
      <div className="odm-mgr-candidate-head">
        <span
          className="odm-tn"
          style={{ fontWeight: 700, color: 'var(--tx3)' }}
        >
          {rank}
        </span>
        <ScoreRing score={drone.score} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700 }}>
            {drone.code} · {drone.name}
          </div>
          <div style={{ color: 'var(--tx3)', fontSize: 12 }}>
            {drone.serialNumber} · {drone.droneModelName}
          </div>
        </div>
      </div>
      <div className="odm-mgr-candidate-metrics">
        <span>
          {t.candidate.battery} <b className="odm-tn">{drone.batteryPct}%</b>
        </span>
        <span>
          {t.candidate.distanceToStation}{' '}
          <b className="odm-tn">{drone.distanceKm} km</b>
        </span>
        <span>
          {t.candidate.enduranceMargin}{' '}
          <b className="odm-tn">{drone.enduranceMarginPct}%</b>
        </span>
        <span>
          {t.candidate.payload} <b>{drone.payload}</b>
        </span>
        <span>
          {t.candidate.hoursSinceMaintenance}{' '}
          <b className="odm-tn">{drone.hoursSinceMaintenance}h</b>
        </span>
      </div>
      <div className="odm-mgr-candidate-reason">
        <div style={{ fontWeight: 700, marginBottom: 2 }}>
          {t.candidate.whySuggested}
        </div>
        {drone.reason}
        <div style={{ color: 'var(--tx3)', fontSize: 11, marginTop: 4 }}>
          {t.candidate.aiNote}
        </div>
      </div>
      <button
        type="button"
        className="odm-btn odm-btn-p odm-btn-sm"
        onClick={onLock}
        disabled={locking}
      >
        {locking ? t.candidate.locking : t.candidate.selectThisDrone}
      </button>
    </div>
  )
}

function OperatorCard({
  rank,
  operator,
  selected,
  onSelect,
}: {
  rank: number
  operator: OperatorCandidate
  selected: boolean
  onSelect: () => void
}) {
  const { t } = useI18n(dispatchPageMessages)
  return (
    <div className={`odm-mgr-candidate-card${selected ? ' selected' : ''}`}>
      <div className="odm-mgr-candidate-head">
        <span
          className="odm-tn"
          style={{ fontWeight: 700, color: 'var(--tx3)' }}
        >
          {rank}
        </span>
        <ScoreRing score={operator.score} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700 }}>{operator.fullName}</div>
          <div style={{ color: 'var(--tx3)', fontSize: 12 }}>
            {operator.licenseClass} ·{' '}
            {t.candidate.validUntil(operator.licenseExpiry)} ·{' '}
            {operator.licenseNumber}
          </div>
        </div>
      </div>
      <div className="odm-mgr-candidate-metrics">
        <span>
          {t.candidate.missionsWithModel}{' '}
          <b className="odm-tn">{operator.missionsWithModel}</b>
        </span>
        <span>
          {t.candidate.successRate}{' '}
          <b className="odm-tn">{operator.successRatePct}%</b>
        </span>
        <span>
          {t.candidate.acceptanceRate}{' '}
          <b className="odm-tn">{operator.acceptanceRatePct}%</b>
        </span>
        <span>
          {t.candidate.missionsThisWeek}{' '}
          <b className="odm-tn">{operator.missionsThisWeek}</b>
        </span>
      </div>
      <div className="odm-mgr-candidate-reason">
        <div style={{ fontWeight: 700, marginBottom: 2 }}>
          {t.candidate.whySuggested}
        </div>
        {operator.reason}
      </div>
      <button
        type="button"
        className={
          selected ? 'odm-btn odm-btn-ok odm-btn-sm' : 'odm-btn odm-btn-sm'
        }
        onClick={onSelect}
      >
        {selected ? t.candidate.selected : t.candidate.selectThisOperator}
      </button>
    </div>
  )
}

function TimelineCard({
  timeline,
}: {
  timeline: ResourceSuggestions['timeline']
}) {
  const { t } = useI18n(dispatchPageMessages)
  if (timeline.resources.length === 0) return null
  return (
    <div className="odm-card" style={{ marginTop: 14 }}>
      <div className="odm-card-header">
        {t.timelineHeader(
          timeline.date,
          timeline.windowStart,
          timeline.windowEnd,
        )}
      </div>
      <div className="odm-card-body">
        {timeline.resources.map((r) => (
          <div key={r.code} className="odm-mgr-timeline-row">
            <span style={{ fontWeight: 700, width: 140 }}>
              {r.code} {r.name}
            </span>
            {r.rejected ? (
              <StatusBadge tone="red">{r.rejectedReason}</StatusBadge>
            ) : null}
            {r.bookings.map((b, i) => (
              <span
                key={i}
                className={b.conflict ? 'odm-mgr-modal-error' : undefined}
                style={{ marginLeft: 8 }}
              >
                {b.missionCode}
                {b.start && b.end
                  ? ` · ${b.start.slice(11, 16)}–${b.end.slice(11, 16)}`
                  : ''}
                {b.conflict ? t.conflict : ''}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function ReleaseModal({
  onClose,
  onConfirm,
}: {
  onClose: () => void
  onConfirm: (reason: string) => void
}) {
  const { t } = useI18n(dispatchPageMessages)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleConfirm() {
    if (!reason.trim()) {
      setError(t.releaseModal.reasonRequired)
      return
    }
    onConfirm(reason)
  }

  return (
    <div className="odm-mgr-modal-overlay">
      <div
        className="odm-mgr-modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="odm-mgr-release-title"
      >
        <div className="odm-mgr-modal-head">
          <div id="odm-mgr-release-title" className="odm-mgr-modal-title">
            {t.releaseModal.title}
          </div>
          <button
            type="button"
            className="odm-btn odm-btn-gh odm-btn-sm odm-btn-ic1"
            onClick={onClose}
            aria-label={t.releaseModal.close}
          >
            ×
          </button>
        </div>
        <div className="odm-mgr-modal-body">
          <label>
            <span className="odm-mgr-modal-label">
              {t.releaseModal.reasonLabel}{' '}
              <span style={{ color: 'var(--red-fg)' }}>*</span>
            </span>
            <textarea
              className="odm-inp"
              rows={3}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value)
                setError(null)
              }}
            />
            {error ? <div className="odm-mgr-modal-error">{error}</div> : null}
          </label>
        </div>
        <div className="odm-mgr-modal-footer">
          <button type="button" className="odm-btn" onClick={onClose}>
            {t.releaseModal.cancel}
          </button>
          <button
            type="button"
            className="odm-btn odm-btn-rd"
            onClick={handleConfirm}
          >
            {t.releaseModal.confirm}
          </button>
        </div>
      </div>
    </div>
  )
}
