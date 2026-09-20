import { useState } from 'react'
import type { MaintenanceFaultType } from '../types'

interface Props {
  missionId: string
  droneId: string
  droneName: string
  failedItems: string[]
  onConfirm: (issueType: MaintenanceFaultType, severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL', description: string) => void
  onCancel: () => void
}

const FAULT_TYPES: { id: MaintenanceFaultType; label: string }[] = [
  { id: 'MOTOR_VIBRATION', label: 'Rung động động cơ' },
  { id: 'SIGNAL_LOSS', label: 'Mất tín hiệu' },
  { id: 'BATTERY_DEGRADED', label: 'Pin xuống cấp' },
  { id: 'CAMERA_GIMBAL', label: 'Camera / Gimbal' },
  { id: 'PHYSICAL_DAMAGE', label: 'Hư hỏng vật lý' },
  { id: 'OTHER', label: 'Khác' },
]

const SEVERITIES: { id: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'; label: string; color: string }[] = [
  { id: 'LOW', label: 'Thấp', color: '#16a34a' },
  { id: 'MEDIUM', label: 'Trung bình', color: '#d97706' },
  { id: 'HIGH', label: 'Cao', color: '#ea580c' },
  { id: 'CRITICAL', label: 'Nghiêm trọng', color: '#dc2626' },
]

export default function MaintenanceTicketDialog({ missionId, droneId, droneName, failedItems, onConfirm, onCancel }: Props) {
  const [issueType, setIssueType] = useState<MaintenanceFaultType>('OTHER')
  const [severity, setSeverity] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM')
  const [description, setDescription] = useState(`Các mục không đạt sau bay: ${failedItems.join(', ')}`)

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div style={{ background: 'var(--sf)', border: '1px solid var(--bd)', borderRadius: 12, padding: '28px', width: 500, maxWidth: 'calc(100vw - 32px)', boxShadow: '0 8px 40px rgba(0,0,0,.18)' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--tx)', margin: '0 0 18px' }}>Tạo ticket bảo trì</h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--tx3)', marginBottom: 4 }}>Drone</div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--tx)' }}>{droneId} {droneName}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--tx3)', marginBottom: 4 }}>Mission</div>
            <div style={{ fontSize: 12, fontFamily: 'var(--font-data)', color: 'var(--tx)' }}>{missionId}</div>
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: 'var(--tx3)', marginBottom: 6 }}>Loại lỗi</div>
          <select
            className="odm-input"
            value={issueType}
            onChange={(e) => setIssueType(e.target.value as MaintenanceFaultType)}
            style={{ fontSize: 13 }}
          >
            {FAULT_TYPES.map((f) => (
              <option key={f.id} value={f.id}>{f.label}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: 'var(--tx3)', marginBottom: 8 }}>Mức độ nghiêm trọng</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {SEVERITIES.map((s) => (
              <button
                key={s.id}
                onClick={() => setSeverity(s.id)}
                style={{
                  flex: 1,
                  padding: '7px 0',
                  borderRadius: 6,
                  border: `1px solid ${severity === s.id ? s.color : 'var(--bd)'}`,
                  background: severity === s.id ? s.color + '1a' : 'var(--sf)',
                  color: severity === s.id ? s.color : 'var(--tx2)',
                  fontSize: 12,
                  fontWeight: severity === s.id ? 600 : 400,
                  cursor: 'pointer',
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: 'var(--tx3)', marginBottom: 6 }}>Mô tả</div>
          <textarea
            className="odm-input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            style={{ width: '100%', resize: 'vertical', boxSizing: 'border-box', fontSize: 13 }}
          />
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="odm-btn odm-btn-gh" onClick={onCancel}>Huỷ</button>
          <button className="odm-btn odm-btn-p" onClick={() => onConfirm(issueType, severity, description)}>Tạo ticket</button>
        </div>
      </div>
    </div>
  )
}
