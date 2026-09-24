// MNG-09: Drone fleet management page
import { useState } from 'react'

import { ApiError } from '../../../shared/api/httpClient'
import { StatusBadge } from '../../../shared/components/odm/StatusBadge'
import { StateView } from '../../../shared/components/odm/StateView'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import {
  droneStatusLabel,
  droneStatusTone,
} from '../../../shared/lib/statusTone'
import type { DroneStatus } from '../../../shared/types/domain'
import { dronesApi } from '../api/dronesApi'
import type { DroneResponse } from '../types/drones'
import '../manager.css'

type FilterChip =
  'ALL' | 'AVAILABLE' | 'FLYING' | 'MAINTENANCE' | 'OUT_OF_SERVICE'

const FILTER_CHIPS: Array<{ value: FilterChip; label: string }> = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'AVAILABLE', label: 'Sẵn sàng' },
  { value: 'FLYING', label: 'Đang bay' },
  { value: 'MAINTENANCE', label: 'Bảo trì' },
  { value: 'OUT_OF_SERVICE', label: 'Ngừng dùng' },
]

// Manager-actionable transitions [ĐỀ XUẤT per MNG-09]
const MANUAL_TRANSITIONS: Partial<Record<DroneStatus, DroneStatus[]>> = {
  AVAILABLE: ['MAINTENANCE', 'OFFLINE'],
  MAINTENANCE: ['AVAILABLE', 'OUT_OF_SERVICE'],
  OUT_OF_SERVICE: ['MAINTENANCE'],
  OFFLINE: ['AVAILABLE'],
}

function matchesFilter(drone: DroneResponse, filter: FilterChip): boolean {
  if (filter === 'ALL') return true
  if (filter === 'AVAILABLE') return drone.status === 'AVAILABLE'
  if (filter === 'FLYING')
    return (
      drone.status === 'IN_MISSION' ||
      drone.status === 'RESERVED' ||
      drone.status === 'RETURNING'
    )
  if (filter === 'MAINTENANCE') return drone.status === 'MAINTENANCE'
  if (filter === 'OUT_OF_SERVICE') return drone.status === 'OUT_OF_SERVICE'
  return true
}

type StatusChangeModalProps = {
  drone: DroneResponse
  onClose: () => void
  onChanged: (updated: DroneResponse) => void
}

function StatusChangeModal({
  drone,
  onClose,
  onChanged,
}: StatusChangeModalProps) {
  const nextStatuses = MANUAL_TRANSITIONS[drone.status] ?? []
  const [selectedStatus, setSelectedStatus] = useState<DroneStatus | ''>(
    nextStatuses[0] ?? '',
  )
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    if (!selectedStatus) return
    if (!reason.trim()) {
      setError('Vui lòng nhập lý do')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const updated = await dronesApi.updateDrone(drone.id, {
        serialNumber: drone.serialNumber,
        droneModelId: drone.droneModel.id,
        dronePayloadId: drone.dronePayload.id,
        status: selectedStatus,
      })
      onChanged(updated)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi không xác định')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
      onClick={onClose}
    >
      <div
        className="odm-card"
        style={{ padding: 24, minWidth: 360, maxWidth: 440 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>
          Đổi trạng thái — {drone.serialNumber}{' '}
          {drone.droneModel?.modelCode ?? ''}
        </h3>

        {nextStatuses.length === 0 ? (
          <div style={{ color: 'var(--tx3)', fontSize: 13 }}>
            Không thể thay đổi trạng thái thủ công từ {drone.status}.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label
                htmlFor="drone-new-status"
                style={{
                  fontSize: 12,
                  color: 'var(--tx2)',
                  display: 'block',
                  marginBottom: 4,
                }}
              >
                Trạng thái mới
              </label>
              <select
                id="drone-new-status"
                className="odm-input"
                value={selectedStatus}
                onChange={(e) =>
                  setSelectedStatus(e.target.value as DroneStatus)
                }
                style={{ width: '100%' }}
              >
                {nextStatuses.map((s) => (
                  <option key={s} value={s}>
                    {droneStatusLabel[s]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="drone-reason"
                style={{
                  fontSize: 12,
                  color: 'var(--tx2)',
                  display: 'block',
                  marginBottom: 4,
                }}
              >
                Lý do *
              </label>
              <textarea
                id="drone-reason"
                className="odm-input"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Nhập lý do thay đổi trạng thái..."
                style={{ width: '100%', resize: 'vertical' }}
              />
            </div>

            {error && (
              <div style={{ color: 'var(--red-fg)', fontSize: 13 }}>
                {error}
              </div>
            )}

            <div
              style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}
            >
              <button
                type="button"
                className="odm-btn"
                onClick={onClose}
                disabled={saving}
              >
                Huỷ
              </button>
              <button
                type="button"
                className="odm-btn odm-btn-p"
                onClick={handleSave}
                disabled={saving || !selectedStatus}
              >
                {saving ? 'Đang lưu...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

type DronesPageProps = {
  droneId?: string
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function DronesPage({ droneId: _droneId }: DronesPageProps) {
  const [filter, setFilter] = useState<FilterChip>('ALL')
  const [changingDrone, setChangingDrone] = useState<DroneResponse | null>(
    null,
  )
  const [drones, setDrones] = useState<DroneResponse[] | null>(null)

  const query = useApiQuery((signal) => dronesApi.listDrones({ signal }), [])

  const allDrones = drones ?? query.data?.items ?? []
  const visible = allDrones.filter((d) => matchesFilter(d, filter))

  const counts = {
    available: allDrones.filter((d) => d.status === 'AVAILABLE').length,
    flying: allDrones.filter(
      (d) =>
        d.status === 'IN_MISSION' ||
        d.status === 'RESERVED' ||
        d.status === 'RETURNING',
    ).length,
    maintenance: allDrones.filter((d) => d.status === 'MAINTENANCE').length,
    outOfService: allDrones.filter((d) => d.status === 'OUT_OF_SERVICE').length,
  }

  function handleChanged(updated: DroneResponse) {
    const base = drones ?? query.data?.items ?? []
    setDrones(base.map((d) => (d.id === updated.id ? updated : d)))
    setChangingDrone(null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div className="odm-mgr-dash-head">
        <div>
          <h1 className="odm-mgr-dash-title">Đội drone</h1>
          {!query.loading && !query.error && (
            <div className="odm-mgr-dash-date" style={{ fontSize: 13 }}>
              {counts.available} sẵn sàng · {counts.flying} đang bay ·{' '}
              {counts.maintenance} bảo trì · {counts.outOfService} ngừng dùng
            </div>
          )}
        </div>
      </div>

      {/* Filter chips */}
      <div
        style={{ display: 'flex', gap: 6, padding: '8px 0', flexWrap: 'wrap' }}
      >
        {FILTER_CHIPS.map((chip) => (
          <button
            key={chip.value}
            type="button"
            className={`odm-chip${filter === chip.value ? ' odm-chip-active' : ''}`}
            onClick={() => setFilter(chip.value)}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {query.loading && (
        <div style={{ padding: 40, textAlign: 'center' }} aria-busy="true">
          <div className="odm-sk" style={{ height: 300, borderRadius: 8 }} />
        </div>
      )}

      {!query.loading && !!query.error && (
        <div style={{ padding: 24 }}>
          <StateView
            state="error"
            title="Không tải được đội drone"
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
              GET /api/drones · {query.error.status ?? '—'}
            </code>
          )}
        </div>
      )}

      {!query.loading && !query.error && visible.length === 0 && (
        <StateView
          state="empty"
          title="Không có drone nào"
          description="Không có drone nào trong bộ lọc này."
        />
      )}

      {!query.loading && !query.error && visible.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: '1px solid var(--border)',
                  color: 'var(--tx3)',
                  textAlign: 'left',
                }}
              >
                <th style={{ padding: '8px 12px', fontWeight: 500 }}>Drone</th>
                <th style={{ padding: '8px 12px', fontWeight: 500 }}>Model</th>
                <th style={{ padding: '8px 12px', fontWeight: 500 }}>
                  Trạng thái
                </th>
                <th style={{ padding: '8px 12px', fontWeight: 500 }}>Pin</th>
                <th style={{ padding: '8px 12px', fontWeight: 500 }}>Trạm</th>
                <th style={{ padding: '8px 12px', fontWeight: 500 }}>
                  Payload
                </th>
                <th style={{ padding: '8px 12px', fontWeight: 500 }}>
                  Giờ bay
                </th>
                <th style={{ padding: '8px 12px', fontWeight: 500 }}>
                  Hoạt động cuối
                </th>
                <th style={{ padding: '8px 12px', fontWeight: 500 }} />
              </tr>
            </thead>
            <tbody>
              {visible.map((drone) => {
                const canChange =
                  (MANUAL_TRANSITIONS[drone.status]?.length ?? 0) > 0
                return (
                  <tr
                    key={drone.id}
                    style={{ borderBottom: '1px solid var(--border)' }}
                  >
                    <td style={{ padding: '8px 12px', fontWeight: 500 }}>
                      {drone.serialNumber}
                      {drone.droneModel?.modelCode ? (
                        <span
                          style={{
                            fontWeight: 400,
                            color: 'var(--tx2)',
                            marginLeft: 4,
                          }}
                        >
                          {drone.droneModel.modelCode}
                        </span>
                      ) : null}
                    </td>
                    <td style={{ padding: '8px 12px', color: 'var(--tx2)' }}>
                      {drone.droneModel?.modelCode ?? '—'}
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      <StatusBadge tone={droneStatusTone[drone.status]}>
                        {droneStatusLabel[drone.status]}
                      </StatusBadge>
                    </td>
                    <td style={{ padding: '8px 12px', color: 'var(--tx2)' }}>
                      —
                    </td>
                    <td style={{ padding: '8px 12px', color: 'var(--tx2)' }}>
                      —
                    </td>
                    <td style={{ padding: '8px 12px', color: 'var(--tx2)' }}>
                      {drone.dronePayload?.modelName ?? '—'}
                    </td>
                    <td style={{ padding: '8px 12px', color: 'var(--tx2)' }}>
                      —
                    </td>
                    <td style={{ padding: '8px 12px', color: 'var(--tx2)' }}>
                      {drone.updatedAt ?? '—'}
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      {canChange && (
                        <button
                          type="button"
                          className="odm-btn"
                          style={{ fontSize: 12 }}
                          onClick={() => setChangingDrone(drone)}
                        >
                          Đổi trạng thái
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Status change modal */}
      {changingDrone && (
        <StatusChangeModal
          drone={changingDrone}
          onClose={() => setChangingDrone(null)}
          onChanged={handleChanged}
        />
      )}
    </div>
  )
}
