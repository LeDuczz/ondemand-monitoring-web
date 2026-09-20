import type { OperatorMission } from '../types'
import { OpBadge } from './OpBadge'
import {
  STATE_BADGE,
  actionLabel,
  countdown,
  fmtDateTime,
  fmtEnd,
} from '../missionFormat'

interface Props {
  mission: OperatorMission
  onView: (m: OperatorMission) => void
}

export default function MissionCard({ mission, onView }: Props) {
  const badge = STATE_BADGE[mission.state] ?? {
    tone: 'gray' as const,
    label: mission.state,
  }
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
      onMouseEnter={(e) =>
        ((e.currentTarget as HTMLDivElement).style.boxShadow =
          '0 2px 12px rgba(0,0,0,.08)')
      }
      onMouseLeave={(e) =>
        ((e.currentTarget as HTMLDivElement).style.boxShadow = 'none')
      }
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 6,
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-data)',
            fontSize: 12,
            color: 'var(--text-3)',
            letterSpacing: '.02em',
          }}
        >
          {mission.id}
        </span>
        <OpBadge tone={badge.tone}>{badge.label}</OpBadge>
      </div>

      <div
        style={{
          fontSize: 15,
          fontWeight: 600,
          color: 'var(--text)',
          marginBottom: 8,
          lineHeight: 1.3,
        }}
      >
        {mission.title}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          marginBottom: 6,
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontSize: 13, color: 'var(--text-2)' }}>
          {date}&nbsp;&nbsp;{time}–{endTime}
        </span>
        <span style={{ fontSize: 13, color: 'var(--text-2)' }}>
          {mission.location}
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          marginBottom: 10,
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 500 }}>
          {mission.droneId} {mission.droneName}
        </span>
        {mission.subtitle && (
          <span style={{ fontSize: 13, color: 'var(--text-2)' }}>
            {mission.subtitle}
          </span>
        )}
      </div>

      {mission.state === 'CANCELLED' && mission.rejectionReason && (
        <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 8 }}>
          Lý do từ chối: {mission.rejectionReason}
        </div>
      )}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{cd ?? ''}</span>
        <button
          className="op-btn op-btn-ghost"
          style={{ fontSize: 13, padding: '5px 14px' }}
          onClick={(e) => {
            e.stopPropagation()
            onView(mission)
          }}
        >
          {actionLabel(mission.state)}
        </button>
      </div>
    </div>
  )
}
