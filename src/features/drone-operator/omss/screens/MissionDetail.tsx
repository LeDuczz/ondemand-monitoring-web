import { useState } from 'react'
import type { OperatorMission } from '../types'
import { OpBadge } from '../components/OpBadge'
import RejectDialog from '../components/RejectDialog'

interface Props {
  mission: OperatorMission
  onBack: () => void
  onAccept: (id: string) => void
  onReject: (id: string, reason: string, notes?: string) => void
  onContinue?: (mission: OperatorMission) => void
}

const WEEKDAYS = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']

function fmtDate(iso: string) {
  const d = new Date(iso)
  return `${WEEKDAYS[d.getDay()]}, ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

function fmtTime(iso: string) {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function KV({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: 13, color: 'var(--text-3)', minWidth: 160 }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', textAlign: 'right', fontFamily: mono ? 'var(--font-data)' : undefined }}>{value}</span>
    </div>
  )
}

export default function MissionDetail({ mission, onBack, onAccept, onReject, onContinue }: Props) {
  const [showReject, setShowReject] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const [acceptedAt] = useState(() => new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }))

  const isWaiting = mission.state === 'WAITING_OPERATOR_ACCEPTANCE'
  const isActive = mission.state === 'IN_FLIGHT' || mission.state === 'SCHEDULED' ||
    mission.state === 'CONNECTED' || mission.state === 'PREFLIGHT_CHECKING' ||
    mission.state === 'READY_TO_FLY'

  function handleAccept() {
    setAccepted(true)
    onAccept(mission.id)
  }

  function handleReject(reason: string, notes?: string) {
    setShowReject(false)
    onReject(mission.id, reason, notes)
  }

  return (
    <div className="fade-in" style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
      {/* Back */}
      <button
        onClick={onBack}
        style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--text-2)', fontSize: 13, cursor: 'pointer', padding: 0, marginBottom: 20 }}
      >
        ← Quay lại danh sách
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 24, alignItems: 'start' }}>
        {/* Left: Map placeholder */}
        <div style={{
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          minHeight: 400,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          color: 'var(--text-3)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Grid lines */}
          <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: .12 }}>
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          <div style={{ position: 'relative', textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{mission.location}</div>
            <div style={{ fontSize: 12, marginBottom: 16 }}>GRID · trần bay {mission.maxAltitudeM}m</div>
            {/* Waypoints */}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              {['H', '1', '2', '3', '4'].map((wp) => (
                <div key={wp} style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: wp === 'H' ? 'var(--green)' : 'var(--blue)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: 11, fontWeight: 700,
                }}>
                  {wp}
                </div>
              ))}
            </div>
            <div style={{ fontSize: 12, marginTop: 12 }}>Bán kính {mission.surveillanceRadiusM}m</div>
          </div>
        </div>

        {/* Right: Info panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Header */}
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: '18px 18px 14px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ fontFamily: 'var(--font-data)', fontSize: 12, color: 'var(--text-3)' }}>{mission.id}</span>
              <OpBadge tone={
                mission.state === 'WAITING_OPERATOR_ACCEPTANCE' ? 'amber' :
                  mission.state === 'IN_FLIGHT' ? 'green' :
                    mission.state === 'COMPLETED' ? 'green' :
                      mission.state === 'CANCELLED' ? 'red' : 'blue'
              }>
                {mission.state === 'WAITING_OPERATOR_ACCEPTANCE' ? 'Chờ phản hồi' :
                  mission.state === 'SCHEDULED' ? 'Đã nhận' :
                    mission.state === 'IN_FLIGHT' ? 'Đang bay' :
                      mission.state === 'COMPLETED' ? 'Hoàn thành' :
                        mission.state === 'CANCELLED' ? 'Bị từ chối' : mission.state}
              </OpBadge>
            </div>

            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 4, lineHeight: 1.3 }}>
              {mission.title}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-2)' }}>{mission.subtitle} · {mission.orderRef}</div>
          </div>

          {/* Details */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px' }}>
            <KV label="Ngày bay" value={fmtDate(mission.scheduledAt)} />
            <KV label="Khung giờ" value={`${fmtTime(mission.scheduledAt)}–${fmtTime(mission.endAt)} · ${mission.estimatedMinutes} phút`} />
            <KV label="Địa điểm" value={mission.location} />
            <KV label="Vùng giám sát" value={`Bán kính ${mission.surveillanceRadiusM} m · trần bay ${mission.maxAltitudeM} m`} />
            {(mission.photoCount > 0 || mission.videoCount > 0) && (
              <KV label="Yêu cầu media" value={[
                mission.photoCount > 0 ? `PHOTO × ${mission.photoCount}${mission.photoSpec ? ' · ' + mission.photoSpec : ''}` : '',
                mission.videoCount > 0 ? `VIDEO × ${mission.videoCount} · ${mission.videoDurationSec} giây · ${mission.videoResolution ?? ''}` : '',
              ].filter(Boolean).join(' | ')} />
            )}
          </div>

          {/* Drone */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.04em' }}>Drone</div>
            <KV label="Tên" value={`${mission.droneId} ${mission.droneName} · ${mission.droneModel}`} />
            <KV label="Payload" value={mission.payload} />
            <KV label="Trạm xuất phát" value={`${mission.stationName}, cách ${mission.stationDistanceKm} km`} />
            <KV label="Pin / Giờ bay" value={`${mission.droneBattery}% · ${mission.droneHoursFromMaintenance}h từ bảo trì`} />
            <div style={{ padding: '9px 0' }}>
              <OpBadge tone={mission.droneStatus === 'AVAILABLE' ? 'green' : 'amber'} size="md">
                {mission.droneStatus === 'AVAILABLE' ? 'Sẵn sàng' : mission.droneStatus}
              </OpBadge>
            </div>
          </div>

          {/* Manager note */}
          {mission.managerNote && (
            <div style={{
              background: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: 10,
              padding: '14px 18px',
            }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#92400e', marginBottom: 6 }}>
                Ghi chú từ {mission.managerName}
              </div>
              <div style={{ fontSize: 13, color: '#78350f', lineHeight: 1.5 }}>{mission.managerNote}</div>
              {mission.responseDeadline && (
                <div style={{ fontSize: 12, color: '#92400e', marginTop: 8, fontWeight: 500 }}>
                  Hãy phản hồi trước {fmtDate(mission.responseDeadline)} {fmtTime(mission.responseDeadline)}
                </div>
              )}
            </div>
          )}

          {/* Footer actions */}
          {isWaiting && !accepted && (
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="op-btn op-btn-ghost"
                style={{ flex: 1 }}
                onClick={() => setShowReject(true)}
              >
                Từ chối
              </button>
              <button
                className="op-btn op-btn-primary"
                style={{ flex: 2 }}
                onClick={handleAccept}
              >
                Chấp nhận
              </button>
            </div>
          )}

          {(accepted || (!isWaiting && !isActive && mission.state !== 'CANCELLED')) && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: 'var(--text-2)' }}>
                Bạn đã chấp nhận mission này lúc {acceptedAt}
              </span>
              <button className="op-btn op-btn-ghost" onClick={onBack}>Về danh sách</button>
            </div>
          )}

          {isActive && !accepted && onContinue && (
            <button className="op-btn op-btn-primary" onClick={() => onContinue(mission)}>
              Tiếp tục bay
            </button>
          )}
        </div>
      </div>

      {showReject && (
        <RejectDialog
          onConfirm={handleReject}
          onCancel={() => setShowReject(false)}
        />
      )}
    </div>
  )
}
