import { useCallback, useEffect, useRef, useState } from 'react'

import { ApiError } from '../../../shared/api/httpClient'
import { StatusBadge } from '../../../shared/components/odm/StatusBadge'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import {
  missionStatusLabel,
  missionStatusTone,
} from '../../../shared/lib/statusTone'
import { missionsApi } from '../api/missionsApi'
import type { LiveTelemetry, MissionCalendarItem } from '../types/missions'
import { managerHref } from '../routes'
import '../manager.css'

const POLL_INTERVAL_MS = 5000

// ── Active-mission sidebar list ────────────────────────────────────────────

const ACTIVE_STATUSES = new Set([
  'IN_FLIGHT',
  'PREFLIGHT_CHECKING',
  'READY_TO_FLY',
  'CONNECTED',
  'IN_PROGRESS',
  'RETURNING',
  'POSTFLIGHT_CHECKING',
])

function ActiveMissionItem({
  mission,
  selected,
  onSelect,
}: {
  mission: MissionCalendarItem
  selected: boolean
  onSelect: () => void
}) {
  const tone = missionStatusTone[mission.status] ?? 'gray'
  const label = missionStatusLabel[mission.status] ?? mission.status

  return (
    <button
      type="button"
      className={`odm-live-item${selected ? ' active' : ''}`}
      onClick={onSelect}
      aria-pressed={selected}
    >
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          color: 'var(--tx3)',
          marginBottom: 2,
        }}
      >
        {mission.missionCode}
      </div>
      <div
        style={{
          fontSize: 13,
          fontWeight: 500,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          marginBottom: 4,
        }}
      >
        {mission.serviceLabel ?? mission.addressText ?? '—'}
      </div>
      <StatusBadge tone={tone}>{label}</StatusBadge>
      <div style={{ fontSize: 12, color: 'var(--tx3)', marginTop: 4 }}>
        {mission.droneCode ?? '—'}
        {mission.operatorName
          ? ` · ${mission.operatorName.split(' ').slice(-2).join(' ')}`
          : ''}
      </div>
    </button>
  )
}

// ── Telemetry row ──────────────────────────────────────────────────────────

function TelemetryCell({
  label,
  value,
  sub,
}: {
  label: string
  value: string
  sub?: string
}) {
  return (
    <div className="odm-live-tele-cell">
      <span className="odm-live-tele-label">{label}</span>
      <span className="odm-live-tele-value">{value}</span>
      {sub && <span className="odm-live-tele-sub">{sub}</span>}
    </div>
  )
}

function formatFlightTime(sec: number): string {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  if (h > 0)
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

// ── Map placeholder ────────────────────────────────────────────────────────

function MapPlaceholder({
  lat,
  lon,
  missionCode,
}: {
  lat: number | null
  lon: number | null
  missionCode: string
}) {
  return (
    <div
      className="odm-live-map"
      style={{ height: 280 }}
      role="img"
      aria-label={`Bản đồ vị trí ${missionCode}`}
    >
      {/* Static SVG map placeholder — no real map library in scope [evd/00-PLAN.md §8] */}
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 600 280"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect width="600" height="280" fill="var(--map-bg)" />
        {/* Road grid */}
        {[60, 140, 220, 300, 380, 460, 540].map((x) => (
          <line
            key={x}
            x1={x}
            y1="0"
            x2={x}
            y2="280"
            stroke="var(--map-road)"
            strokeWidth="4"
          />
        ))}
        {[56, 112, 168, 224].map((y) => (
          <line
            key={y}
            x1="0"
            y1={y}
            x2="600"
            y2={y}
            stroke="var(--map-road)"
            strokeWidth="4"
          />
        ))}
        {/* Water body */}
        <ellipse
          cx="100"
          cy="50"
          rx="80"
          ry="30"
          fill="var(--map-water)"
          opacity="0.7"
        />
        {/* Park */}
        <rect
          x="400"
          y="160"
          width="80"
          height="60"
          fill="var(--map-park)"
          opacity="0.7"
        />
        {/* Orbit circle */}
        <circle
          cx="300"
          cy="140"
          r="60"
          fill="none"
          stroke="var(--blue-dot)"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />
        {/* Drone position marker */}
        <circle cx="300" cy="90" r="8" fill="var(--blue-solid)" opacity="0.9" />
        <circle
          cx="300"
          cy="90"
          r="14"
          fill="none"
          stroke="var(--blue-solid)"
          strokeWidth="1.5"
          opacity="0.5"
        />
      </svg>
      {/* Lat/lon overlay */}
      {lat !== null && lon !== null && (
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            left: 8,
            background: 'rgba(0,0,0,.55)',
            color: '#fff',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            padding: '3px 7px',
            borderRadius: 4,
          }}
        >
          {lat.toFixed(4)}, {lon.toFixed(4)}
        </div>
      )}
    </div>
  )
}

// ── IncidentModal ──────────────────────────────────────────────────────────

const INCIDENT_TYPES = [
  { value: 'WIND', label: 'Gió mạnh / thời tiết' },
  { value: 'OBSTACLE', label: 'Chướng ngại vật' },
  { value: 'SIGNAL_LOSS', label: 'Mất tín hiệu' },
  { value: 'BATTERY_LOW', label: 'Pin yếu bất thường' },
  { value: 'MECHANICAL', label: 'Sự cố cơ học' },
  { value: 'OTHER', label: 'Khác' },
]

function IncidentModal({
  missionId,
  onClose,
  onCreated,
}: {
  missionId: string
  onClose: () => void
  onCreated: () => void
}) {
  const [type, setType] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!type) {
      setError('Chọn loại sự cố.')
      return
    }
    if (!description.trim()) {
      setError('Mô tả là bắt buộc.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await missionsApi.createIncident(missionId, { type, description })
      onCreated()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Lỗi không xác định.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Ghi nhận sự cố"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          background: 'var(--sf)',
          borderRadius: 10,
          padding: 24,
          width: 380,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
          Ghi nhận sự cố
        </h3>
        <label style={{ fontSize: 13 }}>
          Loại sự cố
          <select
            className="odm-inp"
            value={type}
            onChange={(e) => setType(e.target.value)}
            style={{ display: 'block', marginTop: 4, width: '100%' }}
          >
            <option value="">-- Chọn loại --</option>
            {INCIDENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label style={{ fontSize: 13 }}>
          Mô tả chi tiết
          <textarea
            className="odm-inp"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            style={{
              display: 'block',
              marginTop: 4,
              width: '100%',
              resize: 'vertical',
            }}
            placeholder="Mô tả sự cố…"
          />
        </label>
        {error && (
          <div
            role="alert"
            style={{
              fontSize: 12,
              color: 'var(--red-fg)',
              background: 'var(--red-bg)',
              borderRadius: 6,
              padding: '6px 10px',
            }}
          >
            {error}
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" className="odm-btn" onClick={onClose}>
            Huỷ
          </button>
          <button
            type="submit"
            className="odm-btn odm-btn-rd"
            disabled={saving}
          >
            {saving ? 'Đang ghi…' : 'Ghi nhận'}
          </button>
        </div>
      </form>
    </div>
  )
}

// ── CancelModal (2-step) ───────────────────────────────────────────────────

function CancelModal({
  mission,
  onClose,
  onCancelled,
}: {
  mission: MissionCalendarItem
  onClose: () => void
  onCancelled: () => void
}) {
  const [step, setStep] = useState<1 | 2>(1)
  const [reason, setReason] = useState('')
  const [confirmCode, setConfirmCode] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason.trim()) {
      setError('Cần nhập lý do huỷ.')
      return
    }
    if (confirmCode !== mission.missionCode) {
      setError(`Mã mission không khớp. Gõ đúng "${mission.missionCode}".`)
      return
    }
    setSaving(true)
    setError(null)
    try {
      await missionsApi.cancelMission(mission.id, { reason })
      onCancelled()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Lỗi không xác định.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Huỷ mission"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
    >
      <form
        onSubmit={handleConfirm}
        style={{
          background: 'var(--sf)',
          borderRadius: 10,
          padding: 24,
          width: 400,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        {step === 1 ? (
          <>
            <h3
              style={{
                margin: 0,
                fontSize: 16,
                fontWeight: 600,
                color: 'var(--red-fg)',
              }}
            >
              ⚠ Huỷ mission khẩn
            </h3>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--tx2)' }}>
              Mission{' '}
              <strong style={{ fontFamily: 'var(--font-mono)' }}>
                {mission.missionCode}
              </strong>{' '}
              đang hoạt động. Huỷ sẽ gửi lệnh RTL tới drone. Hành động không thể
              hoàn tác.
            </p>
            <label style={{ fontSize: 13 }}>
              Lý do huỷ
              <textarea
                className="odm-inp"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                style={{ display: 'block', marginTop: 4, width: '100%' }}
                placeholder="Lý do huỷ mission…"
                autoFocus
              />
            </label>
            <div
              style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}
            >
              <button type="button" className="odm-btn" onClick={onClose}>
                Đóng
              </button>
              <button
                type="button"
                className="odm-btn odm-btn-rd"
                disabled={!reason.trim()}
                onClick={() => {
                  setError(null)
                  setStep(2)
                }}
              >
                Tiếp tục →
              </button>
            </div>
          </>
        ) : (
          <>
            <h3
              style={{
                margin: 0,
                fontSize: 16,
                fontWeight: 600,
                color: 'var(--red-fg)',
              }}
            >
              Xác nhận huỷ mission
            </h3>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--tx2)' }}>
              Gõ mã mission để xác nhận huỷ:
            </p>
            <code
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 14,
                background: 'var(--sf3)',
                padding: '4px 10px',
                borderRadius: 5,
                display: 'block',
                textAlign: 'center',
              }}
            >
              {mission.missionCode}
            </code>
            <label style={{ fontSize: 13 }}>
              Mã xác nhận
              <input
                type="text"
                className="odm-inp"
                value={confirmCode}
                onChange={(e) => setConfirmCode(e.target.value)}
                placeholder={mission.missionCode}
                style={{ display: 'block', marginTop: 4, width: '100%' }}
                autoFocus
              />
            </label>
            {error && (
              <div
                role="alert"
                style={{
                  fontSize: 12,
                  color: 'var(--red-fg)',
                  background: 'var(--red-bg)',
                  borderRadius: 6,
                  padding: '6px 10px',
                }}
              >
                {error}
              </div>
            )}
            <div
              style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}
            >
              <button
                type="button"
                className="odm-btn"
                onClick={() => setStep(1)}
              >
                ← Quay lại
              </button>
              <button
                type="submit"
                className="odm-btn odm-btn-rd"
                disabled={saving}
              >
                {saving ? 'Đang huỷ…' : 'Huỷ mission'}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  )
}

// ── LiveMainPanel ──────────────────────────────────────────────────────────

function LiveMainPanel({
  mission,
  onCancelled,
}: {
  mission: MissionCalendarItem
  onCancelled: () => void
}) {
  const [telemetry, setTelemetry] = useState<LiveTelemetry | null>(null)
  const [telemetryError, setTelemetryError] = useState<ApiError | null>(null)
  const [showIncidentModal, setShowIncidentModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchLive = useCallback(async () => {
    try {
      const data = await missionsApi.getLive(mission.id)
      setTelemetry(data)
      setTelemetryError(null)
    } catch (err) {
      if (err instanceof ApiError) setTelemetryError(err)
    }
  }, [mission.id])

  useEffect(() => {
    fetchLive()
    intervalRef.current = setInterval(fetchLive, POLL_INTERVAL_MS)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [fetchLive])

  const tone = missionStatusTone[mission.status] ?? 'gray'

  return (
    <>
      {/* Top bar */}
      <div className="odm-live-topbar">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              color: 'var(--tx3)',
            }}
          >
            {mission.missionCode}
          </div>
          <div
            style={{
              fontWeight: 600,
              fontSize: 14,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {mission.serviceLabel ?? mission.addressText ?? '—'}
          </div>
        </div>
        <StatusBadge tone={tone}>
          {missionStatusLabel[mission.status] ?? mission.status}
        </StatusBadge>
        <div style={{ fontSize: 12, color: 'var(--tx2)' }}>
          {mission.droneCode}
          {mission.operatorName ? ` · ${mission.operatorName}` : ''}
          {mission.scheduledStartAt
            ? ` · ${new Date(mission.scheduledStartAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} → dự kiến ${new Date(mission.scheduledEndAt!).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`
            : ''}
        </div>
        <button
          type="button"
          className="odm-btn"
          onClick={() => setShowIncidentModal(true)}
        >
          Ghi nhận sự cố
        </button>
        <button
          type="button"
          className="odm-btn odm-btn-rd"
          onClick={() => setShowCancelModal(true)}
        >
          Huỷ mission khẩn
        </button>
      </div>

      {/* Telemetry error */}
      {telemetryError && (
        <div
          role="alert"
          style={{
            padding: '8px 16px',
            background: 'var(--red-bg)',
            color: 'var(--red-fg)',
            fontSize: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span>
            Mất kết nối telemetry ·{' '}
            <code style={{ fontFamily: 'var(--font-mono)' }}>
              GET /missions/{mission.id}/live · {telemetryError.status ?? '—'}
            </code>
          </span>
          <button
            type="button"
            className="odm-btn"
            style={{ marginLeft: 'auto' }}
            onClick={fetchLive}
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Map */}
      <MapPlaceholder
        lat={telemetry?.latitude ?? mission.centerLat ?? null}
        lon={telemetry?.longitude ?? mission.centerLon ?? null}
        missionCode={mission.missionCode}
      />

      {/* Telemetry cells */}
      {telemetry && (
        <div style={{ padding: 16 }}>
          <div className="odm-live-telemetry">
            <TelemetryCell
              label="Pin"
              value={
                telemetry.batteryPct !== null ? `${telemetry.batteryPct}%` : '—'
              }
              sub="↓ 1%/phút"
            />
            <TelemetryCell
              label="Thời gian bay"
              value={
                telemetry.flightTimeSec !== null
                  ? formatFlightTime(telemetry.flightTimeSec)
                  : '—'
              }
            />
            <TelemetryCell
              label="Độ cao"
              value={
                telemetry.altitudeM !== null
                  ? `${telemetry.altitudeM} m`
                  : '— m'
              }
            />
            <TelemetryCell
              label="Tốc độ"
              value={
                telemetry.speedMs !== null
                  ? `${telemetry.speedMs} m/s`
                  : '— m/s'
              }
            />
            {telemetry.satelliteCount !== null && (
              <TelemetryCell
                label="Vệ tinh"
                value={String(telemetry.satelliteCount)}
                sub="GPS"
              />
            )}
          </div>

          {/* Connection status */}
          <div
            style={{
              marginTop: 8,
              fontSize: 12,
              color: 'var(--tx3)',
              display: 'flex',
              gap: 16,
            }}
          >
            <span>
              connection_status{' '}
              <strong style={{ color: 'var(--tx)' }}>
                {telemetry.connectionStatus ?? '—'}
              </strong>
            </span>
            <span>
              telemetry_active{' '}
              <strong
                style={{
                  color: telemetry.telemetryActive
                    ? 'var(--green-fg)'
                    : 'var(--red-fg)',
                }}
              >
                {telemetry.telemetryActive ? 'TRUE' : 'FALSE'}
              </strong>
            </span>
          </div>
        </div>
      )}

      {/* Livestream block */}
      {telemetry && (
        <div style={{ padding: '0 16px 16px' }}>
          <div
            style={{
              border: '1px solid var(--bd)',
              borderRadius: 8,
              overflow: 'hidden',
              background: 'var(--sf)',
            }}
          >
            <div
              style={{
                padding: '10px 14px',
                borderBottom: '1px solid var(--bd)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              Livestream
              {telemetry.livestream?.isLive && (
                <span
                  style={{
                    background: 'var(--red-solid)',
                    color: 'var(--red-on)',
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: 4,
                    letterSpacing: '0.05em',
                  }}
                >
                  LIVE
                </span>
              )}
            </div>
            {telemetry.livestream?.isLive ? (
              <div style={{ position: 'relative' }}>
                {/* PROPOSED: video element placeholder — no real WebRTC [evd/00-PLAN.md §8] */}
                <video
                  style={{
                    width: '100%',
                    aspectRatio: '16/9',
                    background: '#000',
                    display: 'block',
                  }}
                  poster=""
                  aria-label="Livestream video placeholder"
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'rgba(255,255,255,.6)',
                    fontSize: 13,
                    background: 'rgba(0,0,0,.5)',
                  }}
                >
                  Chưa có kết nối livestream
                </div>
              </div>
            ) : (
              <div
                style={{
                  padding: 24,
                  textAlign: 'center',
                  color: 'var(--tx3)',
                  fontSize: 13,
                }}
              >
                Chưa có phiên livestream
              </div>
            )}
          </div>
        </div>
      )}

      {/* Incident log */}
      {telemetry && telemetry.activeIncidents.length > 0 && (
        <div style={{ padding: '0 16px 16px' }}>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>
            Nhật ký sự cố ({telemetry.activeIncidents.length})
          </div>
          <div
            style={{
              border: '1px solid var(--bd)',
              borderRadius: 8,
              overflow: 'hidden',
            }}
          >
            {telemetry.activeIncidents.map((inc, i) => (
              <div
                key={inc.id}
                style={{
                  padding: '10px 14px',
                  borderBottom:
                    i < telemetry.activeIncidents.length - 1
                      ? '1px solid var(--bd)'
                      : 'none',
                  fontSize: 13,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    alignItems: 'center',
                    marginBottom: 2,
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      color: 'var(--orange-fg)',
                      background: 'var(--orange-bg)',
                      padding: '1px 6px',
                      borderRadius: 4,
                    }}
                  >
                    {inc.type}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--tx3)' }}>
                    {new Date(inc.reportedAt).toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div style={{ color: 'var(--tx2)' }}>{inc.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      {showIncidentModal && (
        <IncidentModal
          missionId={mission.id}
          onClose={() => setShowIncidentModal(false)}
          onCreated={() => {
            setShowIncidentModal(false)
            fetchLive()
          }}
        />
      )}
      {showCancelModal && (
        <CancelModal
          mission={mission}
          onClose={() => setShowCancelModal(false)}
          onCancelled={() => {
            setShowCancelModal(false)
            onCancelled()
          }}
        />
      )}
    </>
  )
}

// ── LivePage ───────────────────────────────────────────────────────────────

export function LivePage({ missionId }: { missionId?: string }) {
  // Load all active missions for the sidebar
  const listQuery = useApiQuery((signal) => {
    // We want missions that are active — no status filter since the API
    // doesn't support multi-value; filter client-side.
    return missionsApi.listMissions({ signal })
  }, [])

  const activeMissions = (listQuery.data?.items ?? []).filter((m) =>
    ACTIVE_STATUSES.has(m.status),
  )

  // Selected mission: prefer URL param → first active
  const [selectedId, setSelectedId] = useState<string | null>(missionId ?? null)

  const selected =
    activeMissions.find(
      (m) => m.id === selectedId || m.missionCode === selectedId,
    ) ??
    activeMissions[0] ??
    null

  // When a mission is cancelled, deselect it and reload
  const handleCancelled = useCallback(() => {
    setSelectedId(null)
    listQuery.reload()
  }, [listQuery])

  return (
    <div className="odm-live" aria-label="Giám sát realtime">
      {/* Left sidebar */}
      <div className="odm-live-sidebar">
        <div className="odm-live-sidebar-head">
          Mission đang hoạt động
          {activeMissions.length > 0 && (
            <span
              style={{
                marginLeft: 6,
                background: 'var(--blue-solid)',
                color: 'var(--blue-on)',
                borderRadius: 10,
                fontSize: 11,
                padding: '1px 6px',
                fontWeight: 600,
              }}
            >
              {activeMissions.length}
            </span>
          )}
        </div>

        {listQuery.loading && (
          <div
            style={{
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
            aria-busy="true"
          >
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="odm-sk"
                style={{ height: 68, borderRadius: 6 }}
              />
            ))}
          </div>
        )}

        {!listQuery.loading && !!listQuery.error && (
          <div
            style={{ padding: 16, fontSize: 12, color: 'var(--red-fg)' }}
            role="alert"
          >
            Không tải được danh sách.
            <button
              type="button"
              className="odm-btn"
              style={{ display: 'block', marginTop: 8 }}
              onClick={listQuery.reload}
            >
              Thử lại
            </button>
          </div>
        )}

        {!listQuery.loading &&
          !listQuery.error &&
          activeMissions.length === 0 && (
            <div
              style={{
                padding: 16,
                fontSize: 12,
                color: 'var(--tx3)',
                textAlign: 'center',
              }}
            >
              Không có mission đang hoạt động.
            </div>
          )}

        {activeMissions.map((m) => (
          <ActiveMissionItem
            key={m.id}
            mission={m}
            selected={selected?.id === m.id}
            onSelect={() => setSelectedId(m.id)}
          />
        ))}
      </div>

      {/* Main panel */}
      <div className="odm-live-main">
        {selected ? (
          <LiveMainPanel
            key={selected.id}
            mission={selected}
            onCancelled={handleCancelled}
          />
        ) : (
          !listQuery.loading && (
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--tx3)',
                gap: 8,
              }}
            >
              <div style={{ fontSize: 40 }}>📡</div>
              <div style={{ fontWeight: 600 }}>Chọn một mission từ sidebar</div>
              <div style={{ fontSize: 13 }}>
                Chưa có mission nào đang bay.{' '}
                <a
                  href={managerHref({ screen: 'schedule' })}
                  style={{ color: 'var(--focus)' }}
                >
                  Xem lịch mission
                </a>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  )
}
