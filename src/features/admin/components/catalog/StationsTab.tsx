import { useEffect, useState } from 'react'

import { ErrorState, LoadingState } from '../../../../shared/components/odm/StateView'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { adminApi } from '../../api/adminApi'
import { AdminToggle } from '../AdminToggle'
import { StationDialog } from './StationDialog'
import type { AdminStation } from '../../types/catalog'

export function StationsTab({ createSignal }: { createSignal: number }) {
  const [dialog, setDialog] = useState<{ station?: AdminStation } | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const { data, loading, error, reload } = useApiQuery((signal) => adminApi.listStations(signal), [])

  useEffect(() => {
    if (createSignal > 0) setDialog({})
  }, [createSignal])

  async function handleToggle(sta: AdminStation) {
    setTogglingId(sta.id)
    try {
      await adminApi.toggleStationActive(sta.id, !sta.isActive)
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
                <th>Trạm</th>
                <th style={{ width: 170 }}>lat, lon</th>
                <th style={{ width: 150 }}>max_service_radius_m</th>
                <th style={{ width: 80 }}>is_active</th>
                <th style={{ width: 50 }} />
              </tr>
            </thead>
            <tbody>
              {data.items.map((sta) => (
                <tr key={sta.id}>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{sta.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--tx3)' }}>{sta.address}</div>
                  </td>
                  <td className="odm-mono" style={{ fontSize: 12 }}>
                    {sta.lat.toFixed(4)}, {sta.lon.toFixed(4)}
                  </td>
                  <td className="odm-mono">{(sta.maxServiceRadiusM / 1000).toFixed(0)} km</td>
                  <td>
                    <AdminToggle
                      active={sta.isActive}
                      label={sta.name}
                      onToggle={() => handleToggle(sta)}
                      disabled={togglingId === sta.id}
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="odm-btn odm-btn-gh odm-btn-sm odm-btn-ic1"
                      onClick={() => setDialog({ station: sta })}
                      aria-label="Sửa trạm"
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
      {dialog !== null && (
        <StationDialog
          station={dialog.station}
          onClose={() => setDialog(null)}
          onSuccess={() => { setDialog(null); reload() }}
        />
      )}
    </div>
  )
}
