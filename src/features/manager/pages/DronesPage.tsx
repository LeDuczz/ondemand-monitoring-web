// MNG-09: Drone fleet management page
import { useState } from 'react'

import { ApiError } from '../../../shared/api/httpClient'
import { StatusBadge } from '../../../shared/components/odm/StatusBadge'
import { StateView } from '../../../shared/components/odm/StateView'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../shared/i18n'
import {
  droneStatusTone,
  getDroneStatusLabel,
} from '../../../shared/lib/statusTone'
import type { DroneStatus } from '../../../shared/types/domain'
import { dronesApi } from '../api/dronesApi'
import type { DroneResponse } from '../types/drones'
import { dronesPageMessages } from './DronesPage.messages'
import '../manager.css'

type FilterChip =
  'ALL' | 'AVAILABLE' | 'FLYING' | 'MAINTENANCE' | 'OUT_OF_SERVICE'

const FILTER_CHIP_VALUES: FilterChip[] = [
  'ALL',
  'AVAILABLE',
  'FLYING',
  'MAINTENANCE',
  'OUT_OF_SERVICE',
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
  const { t, lang } = useI18n(dronesPageMessages)
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
      setError(t.modal.reasonRequired)
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
      setError(e instanceof Error ? e.message : t.unknownError)
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
          {t.modal.title(drone.serialNumber, drone.droneModel?.modelCode ?? '')}
        </h3>

        {nextStatuses.length === 0 ? (
          <div style={{ color: 'var(--tx3)', fontSize: 13 }}>
            {t.modal.cannotChange(getDroneStatusLabel(drone.status, lang))}
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
                {t.modal.newStatus}
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
                    {getDroneStatusLabel(s, lang)}
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
                {t.modal.reason}
              </label>
              <textarea
                id="drone-reason"
                className="odm-input"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t.modal.reasonPlaceholder}
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
                {t.modal.cancel}
              </button>
              <button
                type="button"
                className="odm-btn odm-btn-p"
                onClick={handleSave}
                disabled={saving || !selectedStatus}
              >
                {saving ? t.modal.saving : t.modal.confirm}
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
  const { t, lang } = useI18n(dronesPageMessages)
  const [filter, setFilter] = useState<FilterChip>('ALL')
  const [changingDrone, setChangingDrone] = useState<DroneResponse | null>(null)
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
          <h1 className="odm-mgr-dash-title">{t.title}</h1>
          {!query.loading && !query.error && (
            <div className="odm-mgr-dash-date" style={{ fontSize: 13 }}>
              {t.summary(
                counts.available,
                counts.flying,
                counts.maintenance,
                counts.outOfService,
              )}
            </div>
          )}
        </div>
      </div>

      {/* Filter chips */}
      <div
        style={{ display: 'flex', gap: 6, padding: '8px 0', flexWrap: 'wrap' }}
      >
        {FILTER_CHIP_VALUES.map((chip) => (
          <button
            key={chip}
            type="button"
            className={`odm-chip${filter === chip ? ' odm-chip-active' : ''}`}
            onClick={() => setFilter(chip)}
          >
            {t.filters[chip]}
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
            title={t.loadError}
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
          title={t.emptyTitle}
          description={t.emptyDescription}
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
                <th style={{ padding: '8px 12px', fontWeight: 500 }}>
                  {t.columns.drone}
                </th>
                <th style={{ padding: '8px 12px', fontWeight: 500 }}>
                  {t.columns.model}
                </th>
                <th style={{ padding: '8px 12px', fontWeight: 500 }}>
                  {t.columns.status}
                </th>
                <th style={{ padding: '8px 12px', fontWeight: 500 }}>
                  {t.columns.battery}
                </th>
                <th style={{ padding: '8px 12px', fontWeight: 500 }}>
                  {t.columns.station}
                </th>
                <th style={{ padding: '8px 12px', fontWeight: 500 }}>
                  {t.columns.payload}
                </th>
                <th style={{ padding: '8px 12px', fontWeight: 500 }}>
                  {t.columns.flightHours}
                </th>
                <th style={{ padding: '8px 12px', fontWeight: 500 }}>
                  {t.columns.lastActivity}
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
                        {getDroneStatusLabel(drone.status, lang)}
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
                          {t.changeStatus}
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
