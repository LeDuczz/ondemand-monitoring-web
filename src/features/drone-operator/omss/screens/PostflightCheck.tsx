import { useState } from 'react'
import type { OperatorMission, MaintenanceFaultType } from '../types'
import PreflightItem from '../components/PreflightItem'
import MaintenanceTicketDialog from '../components/MaintenanceTicketDialog'

interface Props {
  mission: OperatorMission
  onComplete: () => void
  onBack: () => void
}

interface PostItem {
  id: string
  label: string
  value: string
}

const ITEMS: PostItem[] = [
  { id: 'battery', label: 'Pin', value: 'Còn 34% · battery_ok' },
  { id: 'motor', label: 'Động cơ', value: 'motor_ok' },
  { id: 'camera', label: 'Camera', value: 'camera_ok' },
  { id: 'gps', label: 'GPS', value: 'gps_ok' },
  { id: 'communication', label: 'Liên lạc', value: 'communication_ok' },
  { id: 'physical', label: 'Tình trạng vật lý', value: 'Cánh quạt, khung, gimbal · physical_condition_ok' },
]

const ITEM_LABEL_MAP: Record<string, string> = {
  battery: 'Pin',
  motor: 'Động cơ',
  camera: 'Camera',
  gps: 'GPS',
  communication: 'Liên lạc',
  physical: 'Tình trạng vật lý',
}

export default function PostflightCheck({ mission, onComplete, onBack }: Props) {
  const [results, setResults] = useState<Record<string, 'PASS' | 'FAIL' | null>>({})
  const [completed, setCompleted] = useState(false)
  const [showTicket, setShowTicket] = useState(false)
  const [ticketCreated, setTicketCreated] = useState(false)

  function handleResult(id: string, r: 'PASS' | 'FAIL') {
    setResults((prev) => ({ ...prev, [id]: r }))
  }

  const answered = ITEMS.filter((item) => results[item.id] !== null && results[item.id] !== undefined).length
  const failed = ITEMS.filter((item) => results[item.id] === 'FAIL')
  const allAnswered = answered === ITEMS.length
  const anyFail = failed.length > 0

  function handleComplete() {
    setCompleted(true)
    onComplete()
  }

  function handleTicketCreated(_issueType: MaintenanceFaultType, _severity: string, _description: string) {
    setShowTicket(false)
    setTicketCreated(true)
  }

  if (completed) {
    return (
      <div className="fade-in" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
        <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 12, padding: '32px 40px', maxWidth: 480, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#166534', margin: '0 0 8px' }}>Mission đã hoàn tất</h2>
          <div style={{ fontSize: 14, color: '#16a34a', marginBottom: 20 }}>
            <div>Mission: <span style={{ fontFamily: 'var(--font-data)' }}>{mission.id}</span></div>
            <div>Drone: {mission.droneId} {mission.droneName}</div>
          </div>
          <button className="op-btn op-btn-primary" onClick={onBack}>Về danh sách mission</button>
        </div>
      </div>
    )
  }

  return (
    <div className="fade-in" style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', maxWidth: 680 }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--text-2)', fontSize: 13, cursor: 'pointer', padding: 0, marginBottom: 16 }}>
        ← Quay lại
      </button>

      <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 4 }}>
        Postflight check · <span style={{ fontFamily: 'var(--font-data)' }}>{mission.id}</span>
      </div>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', margin: '0 0 6px' }}>Postflight check</h1>
      <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 18 }}>{mission.droneId} {mission.droneName}</div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, marginBottom: 16 }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
          Kiểm tra thiết bị sau chuyến bay
        </div>
        {ITEMS.map((item, i) => (
          <div key={item.id} style={{ borderBottom: i < ITEMS.length - 1 ? '1px solid var(--border)' : 'none' }}>
            <PreflightItem
              id={item.id}
              label={item.label}
              value={item.value}
              result={results[item.id] ?? null}
              onResult={handleResult}
            />
          </div>
        ))}
      </div>

      {/* Fail warning */}
      {allAnswered && anyFail && (
        <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8, padding: '12px 16px', marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#9a3412', marginBottom: 8 }}>
            Có mục không đạt: {failed.map((f) => ITEM_LABEL_MAP[f.id]).join(', ')}.
            Nên tạo ticket bảo trì.
          </div>
          {!ticketCreated ? (
            <button className="op-btn op-btn-ghost" style={{ fontSize: 12, borderColor: 'var(--amber)', color: '#92400e' }} onClick={() => setShowTicket(true)}>
              Tạo ticket bảo trì
            </button>
          ) : (
            <span style={{ fontSize: 12, color: '#16a34a' }}>✓ Ticket đã được tạo</span>
          )}
        </div>
      )}

      {allAnswered && (
        <button className="op-btn op-btn-primary" onClick={handleComplete}>
          Hoàn tất mission
        </button>
      )}

      {!allAnswered && (
        <div style={{ fontSize: 13, color: 'var(--text-3)' }}>
          {answered}/{ITEMS.length} mục đã kiểm tra
        </div>
      )}

      {showTicket && (
        <MaintenanceTicketDialog
          missionId={mission.id}
          droneId={mission.droneId}
          droneName={mission.droneName}
          failedItems={failed.map((f) => ITEM_LABEL_MAP[f.id] ?? f.id)}
          onConfirm={handleTicketCreated}
          onCancel={() => setShowTicket(false)}
        />
      )}
    </div>
  )
}
