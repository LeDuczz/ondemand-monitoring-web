import { useState } from 'react'

import { StatusBadge } from '../../../../shared/components/odm/StatusBadge'
import { ErrorState, LoadingState } from '../../../../shared/components/odm/StateView'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { adminApi } from '../../api/adminApi'
import type { AdminStation } from '../../types/catalog'

function StationDialog({
  station,
  onClose,
  onSuccess,
}: {
  station?: AdminStation
  onClose: () => void
  onSuccess: () => void
}) {
  const isEdit = Boolean(station)
  const [code, setCode] = useState(station?.code ?? '')
  const [name, setName] = useState(station?.name ?? '')
  const [address, setAddress] = useState(station?.address ?? '')
  const [lat, setLat] = useState(station?.lat ?? 0)
  const [lon, setLon] = useState(station?.lon ?? 0)
  const [radius, setRadius] = useState(station?.maxServiceRadiusM ?? 5000)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      if (isEdit && station) {
        await adminApi.updateStation(station.id, { name, address, lat, lon, maxServiceRadiusM: radius })
      } else {
        await adminApi.createStation({ code, name, address, lat, lon, maxServiceRadiusM: radius })
      }
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Loi khi luu tram.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="odm-dialog-backdrop" onClick={onClose}>
      <div className="odm-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }} role="dialog" aria-modal="true">
        <div className="odm-dialog-header">
          <h2 className="odm-dialog-title">{isEdit ? 'Sua tram' : 'Tao tram moi'}</h2>
          <button type="button" className="odm-dialog-close" onClick={onClose}>x</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="odm-dialog-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {!isEdit && (
              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--tx2)', marginBottom: 4 }}>Ma tram *</label>
                <input className="odm-input" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} required />
              </div>
            )}
            <div>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--tx2)', marginBottom: 4 }}>Ten tram *</label>
              <input className="odm-input" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--tx2)', marginBottom: 4 }}>Dia chi</label>
              <input className="odm-input" value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--tx2)', marginBottom: 4 }}>Vi do (lat)</label>
                <input className="odm-input" type="number" step="0.0001" value={lat} onChange={(e) => setLat(Number(e.target.value))} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--tx2)', marginBottom: 4 }}>Kinh do (lon)</label>
                <input className="odm-input" type="number" step="0.0001" value={lon} onChange={(e) => setLon(Number(e.target.value))} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--tx2)', marginBottom: 4 }}>Ban kinh (m)</label>
                <input className="odm-input" type="number" value={radius} onChange={(e) => setRadius(Number(e.target.value))} />
              </div>
            </div>
            {error && <p style={{ color: 'var(--red-solid)', fontSize: 13, margin: 0 }}>{error}</p>}
          </div>
          <div className="odm-dialog-footer">
            <button type="button" className="odm-btn odm-btn-gh" onClick={onClose}>Huy</button>
            <button type="submit" className="odm-btn odm-btn-p" disabled={loading}>
              {loading ? 'Dang luu...' : 'Luu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function StationsTab() {
  const [dialog, setDialog] = useState<{ station?: AdminStation } | null>(null)
  const { data, loading, error, reload } = useApiQuery((signal) => adminApi.listStations(signal), [])

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <button type="button" className="odm-btn odm-btn-p" onClick={() => setDialog({})}>
          + Them tram
        </button>
      </div>
      {loading && <LoadingState />}
      {!loading && (error || !data) && <ErrorState error={error} onRetry={reload} />}
      {!loading && data && (
        <div style={{ background: 'var(--sf)', border: '1px solid var(--bd)', borderRadius: 10, overflow: 'hidden' }}>
          <table className="odm-adm-table">
            <thead>
              <tr>
                <th>Tram</th>
                <th>Dia chi</th>
                <th>Toa do</th>
                <th>Ban kinh dich vu</th>
                <th>Trang thai</th>
                <th>Thao tac</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((sta) => (
                <tr key={sta.id}>
                  <td>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{sta.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--tx3)', fontFamily: 'var(--font-mono)' }}>{sta.code}</div>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--tx2)' }}>{sta.address}</td>
                  <td style={{ fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                    {sta.lat.toFixed(4)}, {sta.lon.toFixed(4)}
                  </td>
                  <td style={{ fontSize: 12 }}>{(sta.maxServiceRadiusM / 1000).toFixed(0)} km</td>
                  <td>
                    <StatusBadge tone={sta.isActive ? 'green' : 'gray'}>
                      {sta.isActive ? 'Hoat dong' : 'Tam tat'}
                    </StatusBadge>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="odm-btn odm-btn-gh"
                      style={{ fontSize: 11, padding: '3px 8px' }}
                      onClick={() => setDialog({ station: sta })}
                    >
                      Sua
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
