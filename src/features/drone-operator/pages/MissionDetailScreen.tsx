import { useState } from 'react'

import { StatusBadge } from '../../../shared/components/odm/StatusBadge'
import { EmptyState, LoadingState } from '../../../shared/components/odm/StateView'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { operatorApi } from '../api/operatorApi'
import { operatorHref } from '../routes'
import type { OperatorMission } from '../types/mission'
import { RejectDialog } from './RejectDialog'

const STATUS_TONE = {
  PENDING: 'gray',
  ACCEPTED: 'green',
  IN_FLIGHT: 'blue',
  COMPLETED: 'green',
  REJECTED: 'red',
} as const

const STATUS_LABEL: Record<OperatorMission['status'], string> = {
  PENDING: 'Chờ phản hồi',
  ACCEPTED: 'Đã nhận',
  IN_FLIGHT: 'Đang bay',
  COMPLETED: 'Hoàn thành',
  REJECTED: 'Bị từ chối',
}

function formatVnDate(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00+07:00`)
  const weekdays = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']
  return `${weekdays[d.getDay()]}, ${d.toLocaleDateString('vi-VN')}`
}

function durationMinutes(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  return eh * 60 + em - (sh * 60 + sm)
}

function formatHm(iso: string): string {
  const m = /T(\d{2}):(\d{2})/.exec(iso)
  return m ? `${m[1]}:${m[2]}` : ''
}

export function MissionDetailScreen({ missionId }: { missionId: string }) {
  const query = useApiQuery((signal) => operatorApi.getMission(missionId, signal), [missionId])
  const [showReject, setShowReject] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  if (query.loading) return <LoadingState />
  if (query.error || !query.data) {
    return (
      <EmptyState
        title="Không tải được mission"
        description="Mission có thể không tồn tại hoặc đã bị xoá."
        action={
          <a className="odm-btn odm-btn-p" href={operatorHref({ screen: 'missions' })}>
            Về danh sách
          </a>
        }
      />
    )
  }

  const mission = query.data

  async function handleAccept() {
    setSubmitting(true)
    setActionError(null)
    try {
      await operatorApi.acceptMission(mission.id)
      query.reload()
    } catch {
      setActionError('Không thể chấp nhận mission. Vui lòng thử lại.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleReject(reason: string, notes: string) {
    setSubmitting(true)
    setActionError(null)
    try {
      await operatorApi.rejectMission(mission.id, { reason, notes })
      setShowReject(false)
      query.reload()
    } catch {
      setActionError('Không thể từ chối mission. Vui lòng thử lại.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <span className="odm-mono" style={{ fontWeight: 600, fontSize: 14 }}>
          {mission.id}
        </span>
        <StatusBadge tone={STATUS_TONE[mission.status]}>{STATUS_LABEL[mission.status]}</StatusBadge>
      </div>

      {actionError ? (
        <div
          style={{
            marginBottom: 14,
            padding: '10px 14px',
            borderRadius: 8,
            background: 'var(--red-bg)',
            color: 'var(--red-fg)',
            border: '1px solid var(--red-dot)',
            fontSize: 13,
          }}
        >
          {actionError}
        </div>
      ) : null}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 380px', gap: 16, alignItems: 'start' }}>
        <MapPlaceholder mission={mission} />
        <InfoPanel mission={mission} />
      </div>

      <Footer
        mission={mission}
        submitting={submitting}
        onAccept={handleAccept}
        onOpenReject={() => setShowReject(true)}
      />

      {showReject ? (
        <RejectDialog
          missionId={mission.id}
          submitting={submitting}
          onCancel={() => setShowReject(false)}
          onConfirm={handleReject}
        />
      ) : null}
    </div>
  )
}

function MapPlaceholder({ mission }: { mission: OperatorMission }) {
  return (
    <div className="odm-card" style={{ height: 420, position: 'relative', overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'repeating-linear-gradient(45deg, var(--sf2) 0, var(--sf2) 1px, transparent 1px, transparent 24px)',
        }}
      />
      <div style={{ position: 'absolute', top: 12, left: 14, fontSize: 13, fontWeight: 600 }}>
        {mission.location}
      </div>
      <div style={{ position: 'absolute', top: 34, left: 14, fontSize: 11.5, color: 'var(--tx3)' }}>
        GRID · 60 m · 6 m/s
      </div>
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 220,
          height: 220,
          borderRadius: '50%',
          border: '2px dashed var(--blue-dot)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 34,
          height: 34,
          borderRadius: '50%',
          background: 'var(--ink)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 11,
          fontWeight: 700,
        }}
      >
        H
      </div>
      {[1, 2, 3, 4].map((n, i) => {
        const angle = (i / 4) * 2 * Math.PI
        const x = 50 + Math.cos(angle) * 28
        const y = 50 + Math.sin(angle) * 28
        return (
          <div
            key={n}
            style={{
              position: 'absolute',
              top: `${y}%`,
              left: `${x}%`,
              transform: 'translate(-50%, -50%)',
              width: 26,
              height: 26,
              borderRadius: '50%',
              background: 'var(--blue-dot)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 10.5,
              fontWeight: 700,
            }}
          >
            {n}
          </div>
        )
      })}
    </div>
  )
}

function InfoPanel({ mission }: { mission: OperatorMission }) {
  const minutes = durationMinutes(mission.startTime, mission.endTime)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="odm-card">
        <div className="odm-card-body" style={{ padding: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 2 }}>{mission.title}</div>
          <div style={{ color: 'var(--tx3)', fontSize: 12, marginBottom: 12 }}>
            {mission.serviceLabel} · ORD-2609-0152
          </div>

          <Row label="Ngày bay" value={formatVnDate(mission.date)} />
          <Row
            label="Khung giờ"
            value={`${mission.startTime}–${mission.endTime} · ${minutes} phút`}
          />
          <Row label="Địa điểm" value={mission.location} />
          <Row
            label="Vùng giám sát"
            value={`Bán kính ${mission.radiusMeters ?? 300} m · trần bay ${mission.ceilingMeters ?? 60} m`}
          />
          <Row
            label="Yêu cầu media"
            value={`PHOTO × ${mission.photoCount ?? 40} · ${mission.photoNote ?? 'nhiệt'} | VIDEO × ${
              mission.videoCount ?? 1
            } · ${mission.videoSeconds ?? 180} giây · ${mission.videoResolution ?? '1080p'}`}
          />
        </div>
      </div>

      <div className="odm-card">
        <div className="odm-card-body" style={{ padding: 16 }}>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>
            {mission.droneCode} {mission.droneName}
          </div>
          <div style={{ color: 'var(--tx3)', fontSize: 12, marginBottom: 2 }}>
            {mission.droneModel ?? 'DJI Matrice 350 RTK'}
          </div>
          <div style={{ color: 'var(--tx3)', fontSize: 12, marginBottom: 2 }}>
            Payload {mission.dronePayload ?? 'Zenmuse H20T (THERMAL)'}
          </div>
          <div style={{ color: 'var(--tx3)', fontSize: 12, marginBottom: 8 }}>
            Lấy tại {mission.droneStation ?? 'Trạm Nhà Bè'} · cách {mission.droneStationDistanceKm ?? 2.2} km
          </div>
          <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
            <StatusBadge tone="green">{mission.droneReadinessPct ?? 96}% Sẵn sàng</StatusBadge>
            <span style={{ color: 'var(--tx3)' }}>
              {mission.droneHoursSinceMaintenance ?? 38} giờ bay từ lần bảo trì
            </span>
          </div>
        </div>
      </div>

      {mission.managerNote ? (
        <div
          className="odm-card"
          style={{ background: 'var(--yellow-bg)', borderColor: 'var(--yellow-dot)' }}
        >
          <div className="odm-card-body" style={{ padding: 16 }}>
            <div style={{ fontWeight: 600, fontSize: 12.5, marginBottom: 6, color: 'var(--yellow-fg)' }}>
              Ghi chú của quản lý · {mission.managerName ?? ''}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--yellow-fg)', marginBottom: 8 }}>
              {mission.managerNote}
            </div>
            {mission.respondBy && mission.status === 'PENDING' ? (
              <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--yellow-fg)' }}>
                Hãy phản hồi trước {formatVnDate(mission.respondBy.slice(0, 10))} {formatHm(mission.respondBy)}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '6px 0', fontSize: 12.5, borderTop: '1px solid var(--bd)' }}>
      <span style={{ color: 'var(--tx3)' }}>{label}</span>
      <span style={{ fontWeight: 500, textAlign: 'right' }}>{value}</span>
    </div>
  )
}

function Footer({
  mission,
  submitting,
  onAccept,
  onOpenReject,
}: {
  mission: OperatorMission
  submitting: boolean
  onAccept: () => void
  onOpenReject: () => void
}) {
  if (mission.status === 'PENDING') {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
        <button type="button" className="odm-btn odm-btn-rd" onClick={onOpenReject} disabled={submitting}>
          Từ chối
        </button>
        <button type="button" className="odm-btn odm-btn-p" onClick={onAccept} disabled={submitting}>
          {submitting ? 'Đang xử lý...' : 'Chấp nhận'}
        </button>
      </div>
    )
  }

  if (mission.status === 'ACCEPTED' && mission.acceptedAt) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          marginTop: 16,
          padding: '10px 14px',
          borderRadius: 8,
          background: 'var(--green-bg)',
          color: 'var(--green-fg)',
          border: '1px solid var(--green-dot)',
          fontSize: 13,
        }}
      >
        <span>
          Bạn đã chấp nhận mission này lúc {formatHm(mission.acceptedAt)} · quản lý đã được thông báo
        </span>
        <a className="odm-btn odm-btn-sm" href={operatorHref({ screen: 'missions' })}>
          Về danh sách
        </a>
      </div>
    )
  }

  return null
}
