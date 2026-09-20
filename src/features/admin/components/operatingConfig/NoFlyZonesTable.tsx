import { useState } from 'react'

import { StatusBadge } from '../../../../shared/components/odm/StatusBadge'
import { ErrorState, LoadingState } from '../../../../shared/components/odm/StateView'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { adminApi } from '../../api/adminApi'
import type { NoFlyZone, ZoneType } from '../../types/operatingConfig'
import type { StatusTone } from '../../../../shared/types/domain'

const ZONE_TYPE_LABEL: Record<ZoneType, string> = {
  AIRPORT: 'San bay',
  MILITARY: 'Quan su',
  RESTRICTED: 'Han che',
  TEMPORARY: 'Tam thoi',
}

const ZONE_TYPE_TONE: Record<ZoneType, StatusTone> = {
  AIRPORT: 'red',
  MILITARY: 'red',
  RESTRICTED: 'orange',
  TEMPORARY: 'yellow',
}

function ZoneDialog({
  zone,
  onClose,
  onSuccess,
}: {
  zone?: NoFlyZone
  onClose: () => void
  onSuccess: () => void
}) {
  const isEdit = Boolean(zone)
  const [name, setName] = useState(zone?.name ?? '')
  const [source, setSource] = useState(zone?.source ?? '')
  const [zoneType, setZoneType] = useState<ZoneType>(zone?.zoneType ?? 'RESTRICTED')
  const [lat, setLat] = useState(zone?.lat ?? 0)
  const [lon, setLon] = useState(zone?.lon ?? 0)
  const [radiusM, setRadiusM] = useState(zone?.radiusM ?? 500)
  const [maxAlt, setMaxAlt] = useState<string>(zone?.maxAltitudeM != null ? String(zone.maxAltitudeM) : '')
  const [effectiveFrom, setEffectiveFrom] = useState(zone?.effectiveFrom ?? '')
  const [effectiveTo, setEffectiveTo] = useState(zone?.effectiveTo ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const payload = {
        name, source, zoneType, lat, lon, radiusM,
        maxAltitudeM: maxAlt ? Number(maxAlt) : null,
        effectiveFrom,
        effectiveTo: effectiveTo || null,
        isActive: zone?.isActive ?? true,
      }
      if (isEdit && zone) {
        await adminApi.updateNoFlyZone(zone.id, payload)
      } else {
        await adminApi.createNoFlyZone(payload)
      }
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Loi khi luu vung cam bay.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="odm-dialog-backdrop" onClick={onClose}>
      <div className="odm-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }} role="dialog" aria-modal="true">
        <div className="odm-dialog-header">
          <h2 className="odm-dialog-title">{isEdit ? 'Sua vung cam bay' : 'Them vung cam bay'}</h2>
          <button type="button" className="odm-dialog-close" onClick={onClose}>x</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="odm-dialog-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--tx2)', marginBottom: 4 }}>Ten *</label>
              <input className="odm-input" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--tx2)', marginBottom: 4 }}>Nguon</label>
                <input className="odm-input" value={source} onChange={(e) => setSource(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--tx2)', marginBottom: 4 }}>Loai vung</label>
                <select className="odm-input" value={zoneType} onChange={(e) => setZoneType(e.target.value as ZoneType)}>
                  {(Object.keys(ZONE_TYPE_LABEL) as ZoneType[]).map((t) => (
                    <option key={t} value={t}>{ZONE_TYPE_LABEL[t]}</option>
                  ))}
                </select>
              </div>
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
                <input className="odm-input" type="number" value={radiusM} onChange={(e) => setRadiusM(Number(e.target.value))} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--tx2)', marginBottom: 4 }}>Tran bay toi da (m)</label>
                <input className="odm-input" type="number" value={maxAlt} onChange={(e) => setMaxAlt(e.target.value)} placeholder="Khong gioi han" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--tx2)', marginBottom: 4 }}>Hieu luc tu</label>
                <input className="odm-input" type="date" value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--tx2)', marginBottom: 4 }}>Hieu luc den</label>
                <input className="odm-input" type="date" value={effectiveTo} onChange={(e) => setEffectiveTo(e.target.value)} />
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

export function NoFlyZonesTable() {
  const [dialog, setDialog] = useState<{ zone?: NoFlyZone } | null>(null)
  const { data, loading, error, reload } = useApiQuery(
    (signal) => adminApi.listNoFlyZones(signal),
    [],
  )

  async function handleToggle(zone: NoFlyZone) {
    await adminApi.updateNoFlyZone(zone.id, { isActive: !zone.isActive })
    reload()
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <button type="button" className="odm-btn odm-btn-p" onClick={() => setDialog({})}>
          + Them vung cam bay
        </button>
      </div>
      {loading && <LoadingState />}
      {!loading && (error || !data) && <ErrorState error={error} onRetry={reload} />}
      {!loading && data && (
        <div style={{ background: 'var(--sf)', border: '1px solid var(--bd)', borderRadius: 10, overflow: 'hidden' }}>
          <table className="odm-adm-table">
            <thead>
              <tr>
                <th>Ten</th>
                <th>Loai</th>
                <th>Nguon</th>
                <th>Ban kinh</th>
                <th>Tran bay</th>
                <th>Trang thai</th>
                <th>Thao tac</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((zone) => (
                <tr key={zone.id}>
                  <td style={{ fontWeight: 500, fontSize: 13 }}>{zone.name}</td>
                  <td>
                    <StatusBadge tone={ZONE_TYPE_TONE[zone.zoneType]}>
                      {ZONE_TYPE_LABEL[zone.zoneType]}
                    </StatusBadge>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--tx2)' }}>{zone.source}</td>
                  <td style={{ fontSize: 12 }}>{(zone.radiusM / 1000).toFixed(1)} km</td>
                  <td style={{ fontSize: 12 }}>
                    {zone.maxAltitudeM != null ? `${zone.maxAltitudeM}m` : 'Khong gioi han'}
                  </td>
                  <td>
                    <StatusBadge tone={zone.isActive ? 'green' : 'gray'}>
                      {zone.isActive ? 'Hoat dong' : 'Tat'}
                    </StatusBadge>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        type="button"
                        className="odm-btn odm-btn-gh"
                        style={{ fontSize: 11, padding: '3px 8px' }}
                        onClick={() => setDialog({ zone })}
                      >
                        Sua
                      </button>
                      <button
                        type="button"
                        className="odm-btn odm-btn-gh"
                        style={{ fontSize: 11, padding: '3px 8px' }}
                        onClick={() => handleToggle(zone)}
                      >
                        {zone.isActive ? 'Tat' : 'Bat'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {dialog !== null && (
        <ZoneDialog
          zone={dialog.zone}
          onClose={() => setDialog(null)}
          onSuccess={() => { setDialog(null); reload() }}
        />
      )}
    </div>
  )
}
