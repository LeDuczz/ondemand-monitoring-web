import { StatusBadge } from '../../../shared/components/odm/StatusBadge'
import { setActiveMissionId } from '../api/liveMission'
import { formatDeadline } from '../lib/formatDeadline'
import { operatorHref } from '../routes'
import type { OperatorMission } from '../types/mission'

const STATUS_TONE = {
  PENDING: 'gray',
  ACCEPTED: 'green',
  IN_FLIGHT: 'blue',
  COMPLETED: 'green',
  REJECTED: 'red',
  FAILED: 'red',
} as const

const STATUS_LABEL: Record<OperatorMission['status'], string> = {
  PENDING: 'Chờ phản hồi',
  ACCEPTED: 'Đã nhận',
  IN_FLIGHT: 'Đang bay',
  COMPLETED: 'Hoàn thành',
  REJECTED: 'Bị từ chối',
  FAILED: 'Không hoàn thành',
}

function actionFor(mission: OperatorMission) {
  switch (mission.status) {
    case 'PENDING':
      return { label: 'Phản hồi', cls: 'odm-btn-p', href: operatorHref({ screen: 'missionDetail', missionId: mission.id }) }
    case 'IN_FLIGHT':
      return { label: 'Mở buồng lái', cls: 'odm-btn-bl', href: operatorHref({ screen: 'flight' }) }
    case 'ACCEPTED': {
      if (!mission.date || !mission.startTime) return { label: 'Chi tiết', cls: '', href: operatorHref({ screen: 'missionDetail', missionId: mission.id }) }
      const start = new Date(`${mission.date}T${mission.startTime}:00+07:00`)
      const soon = start.getTime() - Date.now() < 4 * 60 * 60 * 1000
      return soon
        ? { label: 'Bắt đầu', cls: 'odm-btn-ok', href: operatorHref({ screen: 'connect' }) }
        : { label: 'Chi tiết', cls: '', href: operatorHref({ screen: 'missionDetail', missionId: mission.id }) }
    }
    case 'COMPLETED':
    case 'FAILED':
      return { label: 'Chi tiết', cls: '', href: operatorHref({ screen: 'missionDetail', missionId: mission.id }) }
    default:
      return null
  }
}

function weekdayDdMm(dateStr: string, today: string): string {
  if (!dateStr) return 'Chưa lên lịch'
  const d = new Date(`${dateStr}T00:00:00+07:00`)
  if (dateStr === today) return `Hôm nay ${d.toLocaleDateString('vi-VN')}`
  const weekdays = ['CN', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']
  return `${weekdays[d.getDay()]}, ${d.toLocaleDateString('vi-VN')}`
}

export function MissionListTable({
  missions,
  now,
}: {
  missions: OperatorMission[]
  now: Date
}) {
  const today = now.toISOString().slice(0, 10)

  if (missions.length === 0) {
    return (
      <div className="odm-card" style={{ borderTop: 0, borderRadius: '0 0 8px 8px' }}>
        <div className="odm-card-body" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Không có mission</div>
          <div style={{ color: 'var(--tx3)' }}>Không tìm thấy mission phù hợp.</div>
        </div>
      </div>
    )
  }

  return (
    <div className="odm-card" style={{ borderTop: 0, borderRadius: '0 0 8px 8px' }}>
      <table className="odm-table">
        <thead>
          <tr>
            <th style={{ width: 150 }}>Mã mission</th>
            <th>Công việc</th>
            <th style={{ width: 170 }}>Thời gian</th>
            <th style={{ width: 130 }}>Dịch vụ</th>
            <th style={{ width: 140 }}>Drone</th>
            <th style={{ width: 130 }}>Trạng thái</th>
            <th style={{ width: 160 }}>Thời hạn</th>
            <th style={{ width: 110, textAlign: 'right' }} />
          </tr>
        </thead>
        <tbody>
          {missions.map((mission) => {
            const action = actionFor(mission)
            return (
              <tr key={mission.id}>
                <td>
                  <a
                    className="odm-mono"
                    href={operatorHref({ screen: 'missionDetail', missionId: mission.id })}
                    onClick={() => setActiveMissionId(mission.id)}
                    style={{ fontWeight: 600, color: 'var(--blue)', textDecoration: 'none' }}
                  >
                    {mission.missionCode ?? mission.id}
                  </a>
                </td>
                <td>
                  <div style={{ fontWeight: 600 }}>{mission.title}</div>
                  <div style={{ color: 'var(--tx3)', fontSize: 11.5, marginTop: 2 }}>
                    {mission.location}
                  </div>
                </td>
                <td>
                  <div className="odm-tn">{weekdayDdMm(mission.date, today)}</div>
                  <div className="odm-tn" style={{ color: 'var(--tx3)', fontSize: 11.5 }}>
                    {mission.startTime && mission.endTime ? `${mission.startTime}–${mission.endTime}` : '—'}
                  </div>
                </td>
                <td>
                  <span className="odm-opr-chip">{mission.serviceLabel}</span>
                </td>
                <td>
                  {mission.droneCode ? (
                    <>
                      {mission.droneName && mission.droneName !== mission.droneCode ? `${mission.droneCode} ${mission.droneName}` : mission.droneCode}
                    </>
                  ) : (
                    <span style={{ color: 'var(--tx3)' }}>Không phân công</span>
                  )}
                </td>
                <td>
                  <StatusBadge tone={STATUS_TONE[mission.status]}>
                    {STATUS_LABEL[mission.status]}
                  </StatusBadge>
                </td>
                <td>
                  <span className="odm-tn" style={{ fontWeight: 500 }}>
                    {formatDeadline(mission, now)}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  {action ? (
                    <a
                      className={`odm-btn odm-btn-sm ${action.cls}`}
                      href={action.href}
                      onClick={() => setActiveMissionId(mission.id)}
                    >
                      {action.label}
                    </a>
                  ) : null}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
