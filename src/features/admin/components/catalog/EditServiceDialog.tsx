import { useState } from 'react'

import { adminApi } from '../../api/adminApi'
import type { AdminService, ServiceSensor, SensorType } from '../../types/catalog'

const SENSORS: SensorType[] = ['RGB', 'THERMAL', 'ZOOM', 'MULTISPECTRAL']

export function EditServiceDialog({
  service,
  onClose,
  onSuccess,
}: {
  service: AdminService
  onClose: () => void
  onSuccess: () => void
}) {
  const [name, setName] = useState(service.name)
  const [duration, setDuration] = useState(service.defaultDurationMin)
  const [minAlt, setMinAlt] = useState(service.minAltitudeM)
  const [maxAlt, setMaxAlt] = useState(service.maxAltitudeM)
  const [sensors, setSensors] = useState<ServiceSensor[]>(service.sensors)
  const [isActive, setIsActive] = useState(service.isActive)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggleSensor(sensor: SensorType) {
    const existing = sensors.find((s) => s.sensor === sensor)
    if (existing) {
      setSensors(sensors.filter((s) => s.sensor !== sensor))
    } else {
      setSensors([...sensors, { sensor, isMandatory: false }])
    }
  }

  function toggleMandatory(sensor: SensorType) {
    setSensors(sensors.map((s) => (s.sensor === sensor ? { ...s, isMandatory: !s.isMandatory } : s)))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await adminApi.updateService(service.id, {
        name,
        defaultDurationMin: duration,
        minAltitudeM: minAlt,
        maxAltitudeM: maxAlt,
        sensors,
        isActive,
      })
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi lưu dịch vụ.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="odm-dialog-backdrop" onClick={onClose}>
      <div className="odm-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }} role="dialog" aria-modal="true">
        <div className="odm-dialog-header">
          <h2 className="odm-dialog-title">Sửa dịch vụ: {service.code}</h2>
          <button type="button" className="odm-dialog-close" onClick={onClose}>x</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="odm-dialog-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--tx2)', marginBottom: 4 }}>Tên dịch vụ</label>
              <input className="odm-input" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--tx2)', marginBottom: 4 }}>default_duration_min</label>
                <input className="odm-input" type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--tx2)', marginBottom: 4 }}>Độ cao min (m)</label>
                <input className="odm-input" type="number" value={minAlt} onChange={(e) => setMinAlt(Number(e.target.value))} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--tx2)', marginBottom: 4 }}>Độ cao max (m)</label>
                <input className="odm-input" type="number" value={maxAlt} onChange={(e) => setMaxAlt(Number(e.target.value))} />
              </div>
            </div>
            <div>
              <p style={{ fontSize: 12, color: 'var(--tx2)', marginBottom: 6 }}>Cảm biến:</p>
              {SENSORS.map((s) => {
                const entry = sensors.find((x) => x.sensor === s)
                return (
                  <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <input type="checkbox" checked={Boolean(entry)} onChange={() => toggleSensor(s)} id={`sensor-${s}`} />
                    <label htmlFor={`sensor-${s}`} style={{ fontSize: 13 }}>{s}</label>
                    {entry && (
                      <>
                        <input type="checkbox" checked={entry.isMandatory} onChange={() => toggleMandatory(s)} id={`mandatory-${s}`} />
                        <label htmlFor={`mandatory-${s}`} style={{ fontSize: 11, color: 'var(--tx2)' }}>Bắt buộc</label>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
              is_active
            </label>
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
