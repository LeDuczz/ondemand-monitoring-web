import { useState } from 'react'

import { StatusBadge } from '../../../../shared/components/odm/StatusBadge'
import { ErrorState, LoadingState } from '../../../../shared/components/odm/StateView'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { adminApi } from '../../api/adminApi'
import type { AdminService, ServiceSensor, SensorType } from '../../types/catalog'

const SENSORS: SensorType[] = ['RGB', 'THERMAL', 'ZOOM', 'MULTISPECTRAL']

function EditServiceDialog({
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
    setSensors(sensors.map((s) => s.sensor === sensor ? { ...s, isMandatory: !s.isMandatory } : s))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await adminApi.updateService(service.id, { name, defaultDurationMin: duration, minAltitudeM: minAlt, maxAltitudeM: maxAlt, sensors, isActive })
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
                <label style={{ display: 'block', fontSize: 12, color: 'var(--tx2)', marginBottom: 4 }}>Thời lượng (phút)</label>
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
              Đang hoạt động
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

export function ServicesTab() {
  const [editing, setEditing] = useState<AdminService | null>(null)
  const { data, loading, error, reload } = useApiQuery((signal) => adminApi.listServices(signal), [])

  return (
    <div>
      {loading && <LoadingState />}
      {!loading && (error || !data) && <ErrorState error={error} onRetry={reload} />}
      {!loading && data && (
        <div style={{ background: 'var(--sf)', border: '1px solid var(--bd)', borderRadius: 10, overflow: 'hidden' }}>
          <table className="odm-adm-table">
            <thead>
              <tr>
                <th>Tên dịch vụ</th>
                <th>Code</th>
                <th>Thời lượng (phút)</th>
                <th>Độ cao (m)</th>
                <th>Cảm biến</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((svc) => (
                <tr key={svc.id}>
                  <td style={{ fontWeight: 500, fontSize: 13 }}>{svc.name}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--tx3)' }}>{svc.code}</td>
                  <td style={{ textAlign: 'center' }}>{svc.defaultDurationMin}</td>
                  <td style={{ fontSize: 12 }}>{svc.minAltitudeM}–{svc.maxAltitudeM}</td>
                  <td style={{ fontSize: 11 }}>
                    {svc.sensors.map((s) => `${s.sensor}${s.isMandatory ? '*' : ''}`).join(', ')}
                  </td>
                  <td>
                    <StatusBadge tone={svc.isActive ? 'green' : 'gray'}>
                      {svc.isActive ? 'Hoạt động' : 'Tạm tắt'}
                    </StatusBadge>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="odm-btn odm-btn-gh"
                      style={{ fontSize: 11, padding: '3px 8px' }}
                      onClick={() => setEditing(svc)}
                    >
                      Sửa
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
