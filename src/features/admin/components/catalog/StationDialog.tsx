import { useState } from 'react'

import { adminApi } from '../../api/adminApi'
import type { AdminStation } from '../../types/catalog'

export function StationDialog({
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
      setError(err instanceof Error ? err.message : 'Lỗi khi lưu trạm.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="odm-dialog-backdrop" onClick={onClose}>
      <div className="odm-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }} role="dialog" aria-modal="true">
        <div className="odm-dialog-header">
          <h2 className="odm-dialog-title">{isEdit ? 'Sửa trạm' : 'Tạo trạm mới'}</h2>
          <button type="button" className="odm-dialog-close" onClick={onClose}>x</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="odm-dialog-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {!isEdit && (
              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--tx2)', marginBottom: 4 }}>code *</label>
                <input className="odm-input odm-mono" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} required />
              </div>
            )}
            <div>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--tx2)', marginBottom: 4 }}>Tên trạm *</label>
              <input className="odm-input" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--tx2)', marginBottom: 4 }}>Địa chỉ</label>
              <input className="odm-input" value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--tx2)', marginBottom: 4 }}>lat</label>
                <input className="odm-input" type="number" step="0.0001" value={lat} onChange={(e) => setLat(Number(e.target.value))} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--tx2)', marginBottom: 4 }}>lon</label>
                <input className="odm-input" type="number" step="0.0001" value={lon} onChange={(e) => setLon(Number(e.target.value))} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--tx2)', marginBottom: 4 }}>max_service_radius_m</label>
                <input className="odm-input" type="number" value={radius} onChange={(e) => setRadius(Number(e.target.value))} />
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
