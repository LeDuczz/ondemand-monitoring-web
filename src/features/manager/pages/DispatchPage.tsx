import { useState } from 'react'

import { ApiError } from '../../../shared/api/httpClient'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import {
  missionStatusLabel,
  missionStatusTone,
} from '../../../shared/lib/statusTone'
import { StatusBadge } from '../../../shared/components/odm/StatusBadge'
import { missionsApi } from '../api/missionsApi'
import type {
  DroneCandidate,
  Mission,
  OperatorCandidate,
  ResourceSuggestions,
} from '../types/missions'
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
  return (
    <div className="odm-mgr-dash" aria-busy="true" aria-live="polite">
      <span className="odm-sk" style={{ width: '100%', height: 90 }} />
      <div className="odm-mgr-dispatch-grid" style={{ marginTop: 14 }}>
        <span className="odm-sk" style={{ width: '100%', height: 400 }} />
        <span className="odm-sk" style={{ width: '100%', height: 400 }} />
      </div>
      <span className="odm-visually-hidden">Đang tính điểm…</span>
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
            Không tải được mission
          </div>
          <div
            className="odm-mono"
            style={{ fontSize: 11.5, color: 'var(--tx3)' }}
          >
            {debugLine}
          </div>
          <button type="button" className="odm-btn odm-btn-p" onClick={onRetry}>
            Thử lại
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
            Không lấy được gợi ý nguồn lực
          </div>
          <div style={{ color: 'var(--tx3)', maxWidth: 420, lineHeight: 1.5 }}>
            Dịch vụ diễn giải AI phản hồi chậm. Bạn vẫn có thể xem hạng do hệ
            thống tính (không có phần "Vì sao gợi ý").
          </div>
          <div
            className="odm-mono"
            style={{ fontSize: 11.5, color: 'var(--tx3)' }}
          >
            {debugLine}
          </div>
          <button type="button" className="odm-btn odm-btn-p" onClick={onRetry}>
            Thử lại
          </button>
        </div>
      </div>
    </div>
  )
}

function ScoreRing({ score }: { score: number }) {
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
      aria-label={`Điểm ${score}/100`}
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

function DispatchBody({
  mission: initialMission,
  suggestions,
  onMissionChanged,
}: {
  mission: Mission
  suggestions: ResourceSuggestions
  onMissionChanged: () => void
}) {
  const [mission, setMission] = useState(initialMission)
  const [selectedDrone, setSelectedDrone] = useState<string | null>(null)
  const [selectedOperator, setSelectedOperator] = useState<string | null>(null)
  const [conflict, setConflict] = useState<string | null>(null)
  const [assigning, setAssigning] = useState(false)
  const [assignedDone, setAssignedDone] = useState(false)
  const [rejectedOpen, setRejectedOpen] = useState(false)
  const [releaseModal, setReleaseModal] = useState(false)

  const selectedDroneCandidate = suggestions.topDrones.find(
    (d) => d.code === selectedDrone,
  )
  const selectedOperatorCandidate = suggestions.topOperators.find(
    (o) => o.code === selectedOperator,
  )

  async function doAssign(droneCode: string, operatorCode: string) {
    setAssigning(true)
    setConflict(null)
    try {
      const afterDrone = await missionsApi.assignDrone(mission.id, droneCode)
      const afterOperator = await missionsApi.assignOperator(
        mission.id,
        operatorCode,
      )
      setMission(afterOperator)
      void afterDrone
      setAssignedDone(true)
    } catch (err) {
      if (err instanceof ApiError && err.code === 'SCHEDULE_CONFLICT') {
        setConflict(err.message)
      } else {
        setConflict(
          err instanceof ApiError ? err.message : 'Phân công thất bại.',
        )
      }
    } finally {
      setAssigning(false)
    }
  }

  async function handleAssign() {
    if (!selectedDrone || !selectedOperator) return
    await doAssign(selectedDrone, selectedOperator)
  }

  async function handleAutoAssign() {
    const topDrone = suggestions.topDrones[0]
    const topOperator = suggestions.topOperators[0]
    if (!topDrone || !topOperator) return
    setSelectedDrone(topDrone.code)
    setSelectedOperator(topOperator.code)
    await doAssign(topDrone.code, topOperator.code)
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
    setAssignedDone(false)
    setSelectedDrone(null)
    setSelectedOperator(null)
    onMissionChanged()
  }

  const bothAssigned = Boolean(mission.droneId && mission.operatorId)

  return (
    <div className="odm-mgr-dash">
      <div className="odm-mgr-dash-head">
        <div>
          <h1 className="odm-mgr-dash-title">Phân công nguồn lực</h1>
          <div className="odm-mgr-dash-date">
            Gợi ý xếp hạng theo hard filter + điểm số · AI chỉ diễn giải, người
            duyệt quyết định
          </div>
        </div>
        <StatusBadge tone={missionStatusTone[mission.status]} size="lg">
          {missionStatusLabel[mission.status]}
        </StatusBadge>
      </div>

      <div className="odm-card" style={{ marginBottom: 14 }}>
        <div className="odm-card-header">Mission {mission.missionCode}</div>
        <div className="odm-card-body odm-mgr-review-location-grid">
          <div>
            <div className="odm-mgr-review-hint">Order</div>
            <div style={{ fontWeight: 600 }}>
              {mission.orderCode} · Lần thử {mission.attemptNumber}
            </div>
          </div>
          <div>
            <div className="odm-mgr-review-hint">Thời gian</div>
            <div className="odm-mono" style={{ fontWeight: 600 }}>
              {suggestions.scheduledStart} → {suggestions.scheduledEnd}
            </div>
          </div>
          <div>
            <div className="odm-mgr-review-hint">Địa điểm</div>
            <div style={{ fontWeight: 600 }}>
              {suggestions.addressText ?? '—'}
              {suggestions.centerLat != null && suggestions.centerLon != null
                ? ` · ${suggestions.centerLat}, ${suggestions.centerLon}`
                : ''}
              {suggestions.radiusM != null
                ? ` · r ${suggestions.radiusM} m`
                : ''}
            </div>
          </div>
          <div>
            <div className="odm-mgr-review-hint">Yêu cầu media</div>
            <div style={{ fontWeight: 600 }}>
              {suggestions.mediaSummary ?? '—'}
            </div>
          </div>
          <div>
            <div className="odm-mgr-review-hint">Thời lượng yêu cầu</div>
            <div style={{ fontWeight: 600 }}>
              {suggestions.requiredDurationLabel ?? '—'}
            </div>
          </div>
          <div>
            <div className="odm-mgr-review-hint">Cảm biến bắt buộc</div>
            <div style={{ fontWeight: 600 }}>
              {suggestions.requiredSensor ?? '—'}
            </div>
          </div>
          <div>
            <div className="odm-mgr-review-hint">Trạm phục vụ</div>
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
              Không có drone đủ điều kiện
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
                  Ngày thay thế
                </div>
                {suggestions.alternatives.map((alt) => (
                  <div key={alt.priority} className="odm-mgr-rejected-row">
                    <span style={{ fontWeight: 700 }}>{alt.label}</span>
                    <span>
                      {alt.dateLabel} · {alt.windowLabel}
                    </span>
                    <span className="odm-tn">
                      {alt.eligibleDroneCount} drone rảnh
                    </span>
                    <span className="odm-tn">
                      {alt.eligibleOperatorCount} phi công rảnh
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {conflict ? (
        <div className="odm-mgr-modal-error" style={{ marginBottom: 10 }}>
          {conflict}
        </div>
      ) : null}

      {assignedDone ? (
        <div className="odm-card" style={{ marginBottom: 14 }}>
          <div className="odm-card-body">
            <div style={{ fontWeight: 700 }}>Đã phân công.</div>
            <div style={{ color: 'var(--tx3)' }}>
              Drone {selectedDroneCandidate?.name ?? selectedDrone} và phi công{' '}
              {selectedOperatorCandidate?.fullName ?? selectedOperator} đã được
              gán. Thông báo đã gửi tới phi công (chờ phản hồi).
            </div>
          </div>
        </div>
      ) : null}

      <div className="odm-mgr-dispatch-grid">
        <div className="odm-card">
          <div className="odm-card-header">
            Gợi ý drone
            <span
              style={{ fontWeight: 500, color: 'var(--tx3)', fontSize: 11.5 }}
            >
              top {suggestions.topDrones.length} /{' '}
              {suggestions.eligibleDroneCount} đủ điều kiện
            </span>
          </div>
          {suggestions.topDrones.map((d, i) => (
            <DroneCard
              key={d.code}
              rank={i + 1}
              drone={d}
              selected={selectedDrone === d.code}
              onSelect={() => setSelectedDrone(d.code)}
            />
          ))}
        </div>

        <div className="odm-card">
          <div className="odm-card-header">
            Gợi ý phi công
            <span
              style={{ fontWeight: 500, color: 'var(--tx3)', fontSize: 11.5 }}
            >
              top {suggestions.topOperators.length} /{' '}
              {suggestions.eligibleOperatorCount} đủ điều kiện
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
      </div>

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
            Đã bị loại ở hard filter · {suggestions.rejected.drones.length}{' '}
            drone · {suggestions.rejected.operators.length} phi công
          </span>
          <span>{rejectedOpen ? 'Thu gọn' : 'Mở ra'}</span>
        </button>
        {rejectedOpen ? (
          <div className="odm-card-body">
            <div style={{ fontWeight: 700, marginBottom: 6 }}>
              Drone bị loại ({suggestions.rejected.drones.length})
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
              Phi công bị loại ({suggestions.rejected.operators.length})
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
        <span>
          Đã chọn: {selectedDroneCandidate?.name ?? '—'} +{' '}
          {selectedOperatorCandidate?.fullName ?? '—'}
        </span>
        <span style={{ flex: 1 }} />
        <button
          type="button"
          className="odm-btn"
          onClick={() => setReleaseModal(true)}
          disabled={!bothAssigned}
        >
          Thu hồi phân công
        </button>
        <button
          type="button"
          className="odm-btn"
          onClick={handleAutoAssign}
          disabled={assigning || !suggestions.feasible}
        >
          Phân công tự động (chọn hạng 1)
        </button>
        <button
          type="button"
          className="odm-btn odm-btn-ok"
          onClick={handleAssign}
          disabled={!selectedDrone || !selectedOperator || assigning}
        >
          Phân công
        </button>
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

function DroneCard({
  rank,
  drone,
  selected,
  onSelect,
}: {
  rank: number
  drone: DroneCandidate
  selected: boolean
  onSelect: () => void
}) {
  return (
    <div className={`odm-mgr-candidate-card${selected ? ' selected' : ''}`}>
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
          Pin <b className="odm-tn">{drone.batteryPct}%</b>
        </span>
        <span>
          Cách trạm <b className="odm-tn">{drone.distanceKm} km</b>
        </span>
        <span>
          Thời gian bay dư <b className="odm-tn">{drone.enduranceMarginPct}%</b>
        </span>
        <span>
          Payload <b>{drone.payload}</b>
        </span>
        <span>
          Giờ bay từ lần bảo trì{' '}
          <b className="odm-tn">{drone.hoursSinceMaintenance}h</b>
        </span>
      </div>
      <div className="odm-mgr-candidate-reason">
        <div style={{ fontWeight: 700, marginBottom: 2 }}>Vì sao gợi ý</div>
        {drone.reason}
        <div style={{ color: 'var(--tx3)', fontSize: 11, marginTop: 4 }}>
          (AI diễn giải, điểm số do hệ thống tính)
        </div>
      </div>
      <button
        type="button"
        className={
          selected ? 'odm-btn odm-btn-ok odm-btn-sm' : 'odm-btn odm-btn-sm'
        }
        onClick={onSelect}
      >
        {selected ? 'Đã chọn' : 'Chọn drone này'}
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
            {operator.licenseClass} · còn hạn đến {operator.licenseExpiry} ·{' '}
            {operator.licenseNumber}
          </div>
        </div>
      </div>
      <div className="odm-mgr-candidate-metrics">
        <span>
          Mission với model này{' '}
          <b className="odm-tn">{operator.missionsWithModel}</b>
        </span>
        <span>
          Tỉ lệ thành công <b className="odm-tn">{operator.successRatePct}%</b>
        </span>
        <span>
          Tỉ lệ nhận việc{' '}
          <b className="odm-tn">{operator.acceptanceRatePct}%</b>
        </span>
        <span>
          Mission trong tuần{' '}
          <b className="odm-tn">{operator.missionsThisWeek}</b>
        </span>
      </div>
      <div className="odm-mgr-candidate-reason">
        <div style={{ fontWeight: 700, marginBottom: 2 }}>Vì sao gợi ý</div>
        {operator.reason}
      </div>
      <button
        type="button"
        className={
          selected ? 'odm-btn odm-btn-ok odm-btn-sm' : 'odm-btn odm-btn-sm'
        }
        onClick={onSelect}
      >
        {selected ? 'Đã chọn' : 'Chọn phi công này'}
      </button>
    </div>
  )
}

function TimelineCard({
  timeline,
}: {
  timeline: ResourceSuggestions['timeline']
}) {
  if (timeline.resources.length === 0) return null
  return (
    <div className="odm-card" style={{ marginTop: 14 }}>
      <div className="odm-card-header">
        Timeline ngày {timeline.date} · Khung mission này (
        {timeline.windowStart}–{timeline.windowEnd})
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
                {b.conflict ? ' · trùng' : ''}
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
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleConfirm() {
    if (!reason.trim()) {
      setError('Lý do là bắt buộc')
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
            Thu hồi phân công
          </div>
          <button
            type="button"
            className="odm-btn odm-btn-gh odm-btn-sm odm-btn-ic1"
            onClick={onClose}
            aria-label="Đóng"
          >
            ×
          </button>
        </div>
        <div className="odm-mgr-modal-body">
          <label>
            <span className="odm-mgr-modal-label">
              Lý do (bắt buộc) <span style={{ color: 'var(--red-fg)' }}>*</span>
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
            Huỷ
          </button>
          <button
            type="button"
            className="odm-btn odm-btn-rd"
            onClick={handleConfirm}
          >
            Thu hồi
          </button>
        </div>
      </div>
    </div>
  )
}
