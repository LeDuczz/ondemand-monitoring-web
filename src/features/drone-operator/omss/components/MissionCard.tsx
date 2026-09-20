import type { OperatorMission, MissionState } from '../types'
import { OpBadge } from './OpBadge'

interface Props {
  mission: OperatorMission
  onView: (m: OperatorMission) => void
}

const WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

function fmtDateTime(iso: string) {
  const d = new Date(iso)
  const wd = WEEKDAYS[d.getDay()] ?? ''
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return { date: `${wd}, ${day}/${month}/${year}`, time: `${hh}:${mm}` }
}

function fmtEnd(iso: string) {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function countdown(iso: string) {
  const diff = new Date(iso).getTime() - Date.now()
  if (diff <= 0) return null
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  if (days > 0) return `Còn ${days} ngày ${hours} giờ`
  const mins = Math.floor((diff % 3600000) / 60000)
  return `Còn ${hours} giờ ${mins} phút`
}

const STATE_BADGE: Record<MissionState, { tone: 'blue' | 'green' | 'amber' | 'orange' | 'red' | 'gray'; label: string }> = {
  WAITING_OPERATOR_ACCEPTANCE: { tone: 'amber', label: 'Chờ phản hồi' },
  RESOURCE_ASSIGNING: { tone: 'blue', label: 'Đang chuẩn bị' },
  SCHEDULED: { tone: 'blue', label: 'Đã nhận' },
  CONNECTED: { tone: 'blue', label: 'Đã kết nối' },
  PREFLIGHT_CHECKING: { tone: 'blue', label: 'Kiểm tra trước bay' },
  READY_TO_FLY: { tone: 'green', label: 'Sẵn sàng bay' },
  FAILED_PREFLIGHT: { tone: 'red', label: 'Lỗi kiểm tra' },
  PENDING_APPROVAL: { tone: 'amber', label: 'Chờ duyệt' },
  IN_FLIGHT: { tone: 'green', label: 'Đang bay' },
  RETURNING: { tone: 'blue', label: 'Đang trở về' },
  POSTFLIGHT_CHECKING: { tone: 'blue', label: 'Kiểm tra sau bay' },
  COMPLETED: { tone: 'green', label: 'Hoàn thành' },
  FAILED: { tone: 'red', label: 'Thất bại' },
  CANCELLED: { tone: 'red', label: 'Bị từ chối' },
}

function actionLabel(state: MissionState): string {
  if (state === 'WAITING_OPERATOR_ACCEPTANCE') return 'Xem và phản hồi'
  if (state === 'IN_FLIGHT') return 'Tiếp tục bay'
  if (state === 'SCHEDULED' || state === 'CONNECTED' || state === 'READY_TO_FLY') return 'Bắt đầu'
  return 'Chi tiết'
}

export default function MissionCard({ mission, onView }: Props) {
  const badge = STATE_BADGE[mission.state] ?? { tone: 'gray' as const, label: mission.state }
  const { date, time } = fmtDateTime(mission.scheduledAt)
  const endTime = fmtEnd(mission.endAt)
  const cd = countdown(mission.scheduledAt)

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: '16px 18px',
        cursor: 'pointer',
        transition: 'box-shadow .15s',
      }}
      onClick={() => onView(mission)}
      onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 12px rgba(0,0,0,.08)')}
      onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.boxShadow = 'none')}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontFamily: 'var(--font-data)', fontSize: 12, color: 'var(--text-3)', letterSpacing: '.02em' }}>
          {mission.id}
        </span>
        <OpBadge tone={badge.tone}>{badge.label}</OpBadge>
      </div>

      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 8, lineHeight: 1.3 }}>
        {mission.title}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 6, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{date}&nbsp;&nbsp;{time}–{endTime}</span>
        <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{mission.location}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 10, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 500 }}>
          {mission.droneId} {mission.droneName}
        </span>
        {mission.subtitle && (
          <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{mission.subtitle}</span>
        )}
      </div>

      {mission.state === 'CANCELLED' && mission.rejectionReason && (
        <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 8 }}>
          Lý do từ chối: {mission.rejectionReason}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{cd ?? ''}</span>
        <button
          className="op-btn op-btn-ghost"
          style={{ fontSize: 13, padding: '5px 14px' }}
          onClick={(e) => { e.stopPropagation(); onView(mission) }}
        >
          {actionLabel(mission.state)}
        </button>
      </div>
    </div>
  )
}
