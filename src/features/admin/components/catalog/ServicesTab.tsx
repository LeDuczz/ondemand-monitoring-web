import { useState } from 'react'

import { ErrorState, LoadingState } from '../../../../shared/components/odm/StateView'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { adminApi } from '../../api/adminApi'
import { AdminToggle } from '../AdminToggle'
import { EditServiceDialog } from './EditServiceDialog'
import type { AdminService } from '../../types/catalog'

export function ServicesTab() {
  const [editing, setEditing] = useState<AdminService | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const { data, loading, error, reload } = useApiQuery((signal) => adminApi.listServices(signal), [])

  async function handleToggle(svc: AdminService) {
    setTogglingId(svc.id)
    try {
      await adminApi.toggleServiceActive(svc.id, !svc.isActive)
      reload()
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <div>
      {loading && <LoadingState />}
      {!loading && (error || !data) && <ErrorState error={error} onRetry={reload} />}
      {!loading && data && (
        <div className="odm-card" style={{ overflow: 'hidden' }}>
          <table className="odm-adm-table">
            <thead>
              <tr>
                <th>Dịch vụ</th>
                <th style={{ width: 150 }}>default_duration_min</th>
                <th style={{ width: 130 }}>Độ cao min–max</th>
                <th style={{ width: 250 }}>Sensor yêu cầu (* bắt buộc)</th>
                <th style={{ width: 80 }}>is_active</th>
                <th style={{ width: 70 }} />
              </tr>
            </thead>
            <tbody>
              {data.items.map((svc) => (
                <tr key={svc.id}>
                  <td>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{svc.name}</div>
                      <div className="odm-mono" style={{ fontSize: 11, color: 'var(--tx3)' }}>
                        {svc.code}
                      </div>
                    </div>
                  </td>
                  <td className="odm-mono">{svc.defaultDurationMin} phút</td>
                  <td className="odm-mono">
                    {svc.minAltitudeM}–{svc.maxAltitudeM} m
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {svc.sensors.map((s) => (
                        <span
                          key={s.sensor}
                          className={`odm-adm-chip${s.isMandatory ? ' is-mandatory' : ''}`}
                          title={`is_mandatory = ${s.isMandatory}`}
                        >
                          {s.sensor}
                          {s.isMandatory ? ' *' : ''}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <AdminToggle
                      active={svc.isActive}
                      label={svc.name}
                      onToggle={() => handleToggle(svc)}
                      disabled={togglingId === svc.id}
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="odm-btn odm-btn-gh odm-btn-sm odm-btn-ic1"
                      onClick={() => setEditing(svc)}
                      aria-label="Sửa dịch vụ"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 20l4-1 11-11-3-3L5 16z" />
                        <path d="M14 6l3 3" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {editing && (
        <EditServiceDialog
          service={editing}
          onClose={() => setEditing(null)}
          onSuccess={() => { setEditing(null); reload() }}
        />
      )}
    </div>
  )
}
