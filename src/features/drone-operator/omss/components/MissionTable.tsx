import type { CSSProperties } from 'react'
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
  missions: OperatorMission[]
  onView: (m: OperatorMission) => void
}

const TH_STYLE: CSSProperties = {
  textAlign: 'left',
  padding: '10px 12px',
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--text-3)',
  textTransform: 'uppercase',
  letterSpacing: '.02em',
  borderBottom: '1px solid var(--border)',
  whiteSpace: 'nowrap',
}

const TD_STYLE: CSSProperties = {
  padding: '12px',
  fontSize: 13,
  color: 'var(--text)',
  borderBottom: '1px solid var(--border)',
  verticalAlign: 'top',
}

function deadlineLabel(m: OperatorMission): string {
  if (m.state === 'IN_FLIGHT') return 'Đang bay'
  if (m.state === 'COMPLETED') return `Hoàn thành ${fmtEnd(m.endAt)}`
  if (m.state === 'CANCELLED' || m.state === 'FAILED') return '—'
  return countdown(m.scheduledAt) ?? '—'
}

export default function MissionTable({ missions, onView }: Props) {
  return (
    <div
      style={{
        overflowX: 'auto',
        border: '1px solid var(--border)',
        borderRadius: 10,
      }}
    >
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          background: 'var(--surface)',
        }}
      >
        <thead>
          <tr>
            <th style={TH_STYLE}>Mã mission</th>
            <th style={TH_STYLE}>Công việc</th>
            <th style={TH_STYLE}>Thời gian</th>
            <th style={TH_STYLE}>Dịch vụ</th>
            <th style={TH_STYLE}>Drone</th>
            <th style={TH_STYLE}>Trạng thái</th>
            <th style={TH_STYLE}>Thời hạn</th>
            <th style={TH_STYLE} />
          </tr>
        </thead>
        <tbody>
          {missions.map((m) => {
            const badge = STATE_BADGE[m.state] ?? {
              tone: 'gray' as const,
              label: m.state,
            }
            const { date, time } = fmtDateTime(m.scheduledAt)
            const endTime = fmtEnd(m.endAt)
            return (
              <tr
                key={m.id}
                onClick={() => onView(m)}
                style={{ cursor: 'pointer' }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLTableRowElement).style.background =
                    'var(--surface-2)')
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLTableRowElement).style.background =
                    'transparent')
                }
              >
                <td
                  style={{
                    ...TD_STYLE,
                    fontFamily: 'var(--font-data)',
                    color: 'var(--text-3)',
                  }}
                >
                  {m.id}
                </td>
                <td style={TD_STYLE}>
                  <div style={{ fontWeight: 600 }}>{m.title}</div>
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--text-3)',
                      marginTop: 2,
                    }}
                  >
                    {m.location}
                  </div>
                </td>
                <td style={TD_STYLE}>
                  <div>{date}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                    {time}–{endTime}
                  </div>
                </td>
                <td style={TD_STYLE}>{m.subtitle || '—'}</td>
                <td style={TD_STYLE}>
                  <div>{m.droneId}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                    {m.droneName}
                  </div>
                </td>
                <td style={TD_STYLE}>
                  <OpBadge tone={badge.tone}>{badge.label}</OpBadge>
                </td>
                <td style={{ ...TD_STYLE, color: 'var(--text-2)' }}>
                  {deadlineLabel(m)}
                </td>
                <td style={{ ...TD_STYLE, textAlign: 'right' }}>
                  <button
                    className="op-btn op-btn-ghost"
                    style={{ fontSize: 12, padding: '5px 12px' }}
                    onClick={(e) => {
                      e.stopPropagation()
                      onView(m)
                    }}
                  >
                    {actionLabel(m.state)}
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
