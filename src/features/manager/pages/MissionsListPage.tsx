// MNG-08: Mission list + detail panel
import { useEffect, useState } from 'react'

import { ApiError } from '../../../shared/api/httpClient'
import { StatusBadge } from '../../../shared/components/odm/StatusBadge'
import { StateView } from '../../../shared/components/odm/StateView'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import {
  missionStatusLabel,
  missionStatusTone,
} from '../../../shared/lib/statusTone'
import type { MissionStatus } from '../../../shared/types/domain'
import { missionsApi } from '../api/missionsApi'
import { managerHref } from '../routes'
import type { MissionCalendarItem } from '../types/missions'
import '../manager.css'

type StatusChip = 'ALL' | MissionStatus

const STATUS_CHIPS: Array<{ value: StatusChip; label: string }> = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'IN_FLIGHT', label: 'Đang chạy' },
  { value: 'COMPLETED', label: 'Hoàn thành' },
  { value: 'FAILED', label: 'Thất bại' },
  { value: 'CREATED', label: 'Mới tạo' },
]

function formatScheduled(start: string | null, end: string | null): string {
  if (!start) return '—'
  const d = new Date(start)
  const dateStr = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`
  const startTime = d.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  })
  if (!end) return `${dateStr} ${startTime}`
  const endD = new Date(end)
  const endTime = endD.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  })
  return `${dateStr} ${startTime}–${endTime}`
}

type DetailPanelProps = {
  mission: MissionCalendarItem
  onClose: () => void
  onRetried: (newId: string) => void
}

function DetailPanel({ mission, onClose, onRetried }: DetailPanelProps) {
  const [retrying, setRetrying] = useState(false)
  const [retryError, setRetryError] = useState<string | null>(null)

  async function handleRetry() {
    setRetrying(true)
    setRetryError(null)
    try {
      const result = await missionsApi.retryMission(mission.id)
      onRetried(result.newMissionId)
    } catch (e) {
      setRetryError(e instanceof Error ? e.message : 'Lỗi không xác định')
    } finally {
      setRetrying(false)
    }
  }

  return (
    <div
      style={{
        width: 360,
        borderLeft: '1px solid var(--border)',
        padding: '16px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontWeight: 600, fontSize: 14 }}>
          {mission.missionCode}
        </span>
        <button
          type="button"
          className="odm-btn"
          onClick={onClose}
          aria-label="Đóng"
        >
          ✕
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <StatusBadge tone={missionStatusTone[mission.status]}>
          {missionStatusLabel[mission.status]}
        </StatusBadge>
        {(mission.status === 'CREATED' || mission.status === 'RESOURCE_ASSIGNING') && (
          <a
            href={managerHref({ screen: 'missionDispatch', missionId: mission.id })}
            className="odm-btn odm-btn-p odm-btn-sm"
          >
            Phân công →
          </a>
        )}
      </div>

      <div
        style={{
          fontSize: 13,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {mission.orderCode && (
          <div>
            <span style={{ color: 'var(--tx3)' }}>Đơn hàng: </span>
            <span>{mission.orderCode}</span>
          </div>
        )}
        {mission.serviceLabel && (
          <div>
            <span style={{ color: 'var(--tx3)' }}>Dịch vụ: </span>
            <span>{mission.serviceLabel}</span>
          </div>
        )}
        <div>
          <span style={{ color: 'var(--tx3)' }}>Lần bay: </span>
          <span>#{mission.attemptNumber ?? 1}</span>
        </div>
        <div>
          <span style={{ color: 'var(--tx3)' }}>Lịch bay: </span>
          <span>
            {formatScheduled(mission.scheduledStartAt, mission.scheduledEndAt)}
          </span>
        </div>
        {mission.droneCode && (
          <div>
            <span style={{ color: 'var(--tx3)' }}>Drone: </span>
            <span>
              {mission.droneCode}
              {mission.droneName ? ` ${mission.droneName}` : ''}
            </span>
          </div>
        )}
        {mission.operatorName && (
          <div>
            <span style={{ color: 'var(--tx3)' }}>Phi công: </span>
            <span>{mission.operatorName}</span>
          </div>
        )}
        {mission.addressText && (
          <div>
            <span style={{ color: 'var(--tx3)' }}>Địa chỉ: </span>
            <span>{mission.addressText}</span>
          </div>
        )}
      </div>

      {mission.status === 'FAILED' && (
        <div
          style={{
            borderTop: '1px solid var(--border)',
            paddingTop: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {retryError && (
            <div style={{ color: 'var(--red-fg)', fontSize: 12 }}>
              {retryError}
            </div>
          )}
          <button
            type="button"
            className="odm-btn odm-btn-p"
            disabled={retrying}
            onClick={handleRetry}
          >
            {retrying ? 'Đang tạo lại...' : 'Tạo lại mission'}
          </button>
        </div>
      )}
    </div>
  )
}

type MissionsListPageProps = {
  missionId?: string
}

export function MissionsListPage({ missionId }: MissionsListPageProps) {
  const [statusFilter, setStatusFilter] = useState<StatusChip>('ALL')
  const [selectedMission, setSelectedMission] =
    useState<MissionCalendarItem | null>(null)

  const query = useApiQuery(
    (signal) =>
      missionsApi.listMissions({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        signal,
      }),
    [statusFilter],
  )

  const missions = query.data?.items ?? []

  useEffect(() => {
    if (missionId && missions.length > 0) {
      const found = missions.find((m) => m.id === missionId) ?? null
      setSelectedMission(found)
    }
  }, [missionId, missions])

  function handleRetried(newId: string) {
    query.reload()
    alert(`Đã tạo lại mission: ${newId}`)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div className="odm-mgr-dash-head">
        <div>
          <h1 className="odm-mgr-dash-title">Mission</h1>
          <div className="odm-mgr-dash-date">
            {!query.loading && !query.error
              ? `${missions.length} mission`
              : ' '}
          </div>
        </div>
      </div>

      {/* Filter chips */}
      <div
        style={{ display: 'flex', gap: 6, padding: '8px 0', flexWrap: 'wrap' }}
      >
        {STATUS_CHIPS.map((chip) => (
          <button
            key={chip.value}
            type="button"
            className={`odm-chip${statusFilter === chip.value ? ' odm-chip-active' : ''}`}
            onClick={() => setStatusFilter(chip.value)}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Main area */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* Table area */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {query.loading && (
            <div
              style={{ padding: 40, textAlign: 'center', color: 'var(--tx3)' }}
              aria-busy="true"
            >
              <div
                className="odm-sk"
                style={{ height: 300, borderRadius: 8 }}
              />
            </div>
          )}

          {!query.loading && !!query.error && (
            <div style={{ padding: 24 }}>
              <StateView
                state="error"
                title="Không tải được danh sách mission"
                error={query.error}
                onRetry={query.reload}
              />
              {query.error instanceof ApiError && (
                <code
                  className="odm-mono"
                  style={{
                    display: 'block',
                    fontSize: 11,
                    color: 'var(--tx3)',
                    marginTop: 8,
                  }}
                >
                  GET /api/missions · {query.error.status ?? '—'}
                </code>
              )}
            </div>
          )}

          {!query.loading && !query.error && missions.length === 0 && (
            <StateView
              state="empty"
              title="Không có mission nào"
              description="Chưa có mission nào trong bộ lọc này."
            />
          )}

          {!query.loading && !query.error && missions.length > 0 && (
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: 13,
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: '1px solid var(--border)',
                    color: 'var(--tx3)',
                    textAlign: 'left',
                  }}
                >
                  <th style={{ padding: '8px 12px', fontWeight: 500 }}>
                    Mission
                  </th>
                  <th style={{ padding: '8px 12px', fontWeight: 500 }}>
                    Đơn hàng
                  </th>
                  <th style={{ padding: '8px 12px', fontWeight: 500 }}>Lần</th>
                  <th style={{ padding: '8px 12px', fontWeight: 500 }}>
                    Lịch bay
                  </th>
                  <th style={{ padding: '8px 12px', fontWeight: 500 }}>
                    Drone
                  </th>
                  <th style={{ padding: '8px 12px', fontWeight: 500 }}>
                    Phi công
                  </th>
                  <th style={{ padding: '8px 12px', fontWeight: 500 }}>
                    Trạng thái
                  </th>
                </tr>
              </thead>
              <tbody>
                {missions.map((m) => (
                  <tr
                    key={m.id}
                    style={{
                      borderBottom: '1px solid var(--border)',
                      cursor: 'pointer',
                      background:
                        selectedMission?.id === m.id ? 'var(--bg2)' : undefined,
                    }}
                    onClick={() =>
                      setSelectedMission(
                        selectedMission?.id === m.id ? null : m,
                      )
                    }
                  >
                    <td style={{ padding: '8px 12px', fontWeight: 500 }}>
                      {m.missionCode}
                    </td>
                    <td style={{ padding: '8px 12px', color: 'var(--tx2)' }}>
                      {m.orderCode ?? '—'}
                    </td>
                    <td style={{ padding: '8px 12px', color: 'var(--tx2)' }}>
                      #{m.attemptNumber ?? 1}
                    </td>
                    <td style={{ padding: '8px 12px', color: 'var(--tx2)' }}>
                      {formatScheduled(m.scheduledStartAt, m.scheduledEndAt)}
                    </td>
                    <td style={{ padding: '8px 12px', color: 'var(--tx2)' }}>
                      {m.droneCode
                        ? `${m.droneCode}${m.droneName ? ` ${m.droneName}` : ''}`
                        : '—'}
                    </td>
                    <td style={{ padding: '8px 12px', color: 'var(--tx2)' }}>
                      {m.operatorName ?? '—'}
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      <StatusBadge tone={missionStatusTone[m.status]}>
                        {missionStatusLabel[m.status]}
                      </StatusBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Detail side panel */}
        {selectedMission && (
          <DetailPanel
            key={selectedMission.id}
            mission={selectedMission}
            onClose={() => setSelectedMission(null)}
            onRetried={handleRetried}
          />
        )}
      </div>
    </div>
  )
}

// Re-export missionId for ManagerApp
export type { MissionsListPageProps }
