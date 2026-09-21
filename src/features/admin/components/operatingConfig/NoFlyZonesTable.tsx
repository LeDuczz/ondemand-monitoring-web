import { useState } from 'react'

import { StatusBadge } from '../../../../shared/components/odm/StatusBadge'
import { ErrorState, LoadingState } from '../../../../shared/components/odm/StateView'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { adminApi } from '../../api/adminApi'
import type { NoFlyZone, ZoneType } from '../../types/operatingConfig'
import type { StatusTone } from '../../../../shared/types/domain'

const ZONE_TYPE_LABEL: Record<ZoneType, string> = {
  AIRPORT: 'Sân bay',
  MILITARY: 'Quân sự',
  RESTRICTED: 'Hạn chế',
  TEMPORARY: 'Tạm thời',
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
      setError(err instanceof Error ? err.message : 'Lỗi khi lưu vùng cấm bay.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="odm-dialog-backdrop" onClick={onClose}>
      <div className="odm-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }} role="dialog" aria-modal="true">
        <div className="odm-dialog-header">
          <h2 className="odm-dialog-title">{isEdit ? 'Sửa vùng cấm bay' : 'Thêm vùng cấm bay'}</h2>
          <button type="button" className="odm-dialog-close" onClick={onClose}>x</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="odm-dialog-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--tx2)', marginBottom: 4 }}>Tên *</label>
              <input className="odm-input" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--tx2)', marginBottom: 4 }}>Nguồn</label>
                <input className="odm-input" value={source} onChange={(e) => setSource(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--tx2)', marginBottom: 4 }}>Loại vùng</label>
                <select className="odm-input" value={zoneType} onChange={(e) => setZoneType(e.target.value as ZoneType)}>
                  {(Object.keys(ZONE_TYPE_LABEL) as ZoneType[]).map((t) => (
                    <option key={t} value={t}>{ZONE_TYPE_LABEL[t]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--tx2)', marginBottom: 4 }}>Vĩ độ (lat)</label>
                <input className="odm-input" type="number" step="0.0001" value={lat} onChange={(e) => setLat(Number(e.target.value))} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--tx2)', marginBottom: 4 }}>Kinh độ (lon)</label>
                <input className="odm-input" type="number" step="0.0001" value={lon} onChange={(e) => setLon(Number(e.target.value))} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--tx2)', marginBottom: 4 }}>Bán kính (m)</label>
                <input className="odm-input" type="number" value={radiusM} onChange={(e) => setRadiusM(Number(e.target.value))} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--tx2)', marginBottom: 4 }}>Trần bay tối đa (m)</label>
                <input className="odm-input" type="number" value={maxAlt} onChange={(e) => setMaxAlt(e.target.value)} placeholder="Không giới hạn" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--tx2)', marginBottom: 4 }}>Hiệu lực từ</label>
                <input className="odm-input" type="date" value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--tx2)', marginBottom: 4 }}>Hiệu lực đến</label>
                <input className="odm-input" type="date" value={effectiveTo} onChange={(e) => setEffectiveTo(e.target.value)} />
              </div>
            </div>
            {error && <p style={{ color: 'var(--red-solid)', fontSize: 13, margin: 0 }}>{error}</p>}
          </div>
          <div className="odm-dialog-footer">
            <button type="button" className="odm-btn odm-btn-gh" onClick={onClose}>Hủy</button>
            <button type="submit" className="odm-btn odm-btn-p" disabled={loading}>
              {loading ? 'Đang lưu...' : 'Lưu'}
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
          + Thêm vùng cấm bay
        </button>
      </div>
      {loading && <LoadingState />}
      {!loading && (error || !data) && <ErrorState error={error} onRetry={reload} />}
      {!loading && data && (
        <div style={{ background: 'var(--sf)', border: '1px solid var(--bd)', borderRadius: 10, overflow: 'hidden' }}>
          <table className="odm-adm-table">
            <thead>
              <tr>
                <th>Tên</th>
                <th>Loại</th>
                <th>Nguồn</th>
                <th>Bán kính</th>
                <th>Trần bay</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
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
                    {zone.maxAltitudeM != null ? `${zone.maxAltitudeM}m` : 'Không giới hạn'}
                  </td>
                  <td>
                    <StatusBadge tone={zone.isActive ? 'green' : 'gray'}>
                      {zone.isActive ? 'Hoạt động' : 'Tắt'}
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
                        {zone.isActive ? 'Tắt' : 'Bật'}
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
