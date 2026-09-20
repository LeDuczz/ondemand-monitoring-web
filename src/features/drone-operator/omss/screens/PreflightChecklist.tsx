import { useState } from 'react'
import type { OperatorMission } from '../types'
import PreflightItem from '../components/PreflightItem'

interface Props {
  mission: OperatorMission
  droneBattery?: number
  onPass: () => void
  onFail: () => void
  onBack: () => void
}

type ItemResult = 'PASS' | 'FAIL' | null

interface CheckItem {
  id: string
  group: string
  label: string
  value: string
}

const CHECKLIST: CheckItem[] = [
  { id: 'battery', group: 'Thiết bị', label: 'Pin drone', value: '100% · battery_ok' },
  { id: 'gps', group: 'Thiết bị', label: 'GPS', value: '18 vệ tinh · gps_ok' },
  { id: 'camera', group: 'Thiết bị', label: 'Camera', value: 'Zenmuse P1 · camera_ok' },
  { id: 'motor', group: 'Thiết bị', label: 'Động cơ', value: 'motor_ok' },
  { id: 'compass', group: 'Thiết bị', label: 'La bàn', value: 'compass_ok' },
  { id: 'link', group: 'Thiết bị', label: 'Kết nối', value: 'Liên kết telemetry heartbeat 10 Hz · link_ok' },
  { id: 'payload', group: 'Thiết bị', label: 'Payload', value: 'Đã gắn đúng · payload_mounted_ok' },
  { id: 'weather', group: 'Môi trường', label: 'Thời tiết', value: 'Gió 6 m/s · dự báo không mưa · weather_ok' },
  { id: 'airspace', group: 'Môi trường', label: 'Không phận', value: 'Không giao với vùng cấm · airspace_ok' },
]

export default function PreflightChecklist({ mission, onPass, onFail, onBack }: Props) {
  const [results, setResults] = useState<Record<string, ItemResult>>({})

  function handleResult(id: string, r: 'PASS' | 'FAIL') {
    setResults((prev) => ({ ...prev, [id]: r }))
  }

  const answered = Object.values(results).filter((r) => r !== null).length
  const passed = Object.values(results).filter((r) => r === 'PASS').length
  const failed = Object.values(results).filter((r) => r === 'FAIL').length
  const total = CHECKLIST.length
  const allAnswered = answered === total

  const groups = ['Thiết bị', 'Môi trường']

  return (
    <div className="fade-in" style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', maxWidth: 700 }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--text-2)', fontSize: 13, cursor: 'pointer', padding: 0, marginBottom: 16 }}>
        ← Quay lại
      </button>

      <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 4 }}>
        Preflight checklist · <span style={{ fontFamily: 'var(--font-data)' }}>{mission.id}</span>
      </div>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', margin: '0 0 6px' }}>Preflight checklist</h1>
      <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 18 }}>{mission.droneId} {mission.droneName}</div>

      {groups.map((group) => (
        <div key={group} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, marginBottom: 16 }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: 13, fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '.04em' }}>
            {group}
          </div>
          {CHECKLIST.filter((c) => c.group === group).map((item, idx, arr) => (
            <div key={item.id} style={{ borderBottom: idx < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
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
      ))}

      {/* Summary */}
      {allAnswered && (
        <div style={{
          background: failed > 0 ? '#fef2f2' : '#f0fdf4',
          border: `1px solid ${failed > 0 ? '#fca5a5' : '#86efac'}`,
          borderRadius: 10,
          padding: '14px 18px',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10,
        }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: failed > 0 ? '#991b1b' : '#166534' }}>
            {passed}/{total} mục đạt {failed > 0 ? 'FAIL · CHẶN BAY' : 'PASS · đủ điều kiện cất cánh'}
          </span>
          {failed > 0 ? (
            <button className="op-btn op-btn-ghost" style={{ fontSize: 12, borderColor: 'var(--red)', color: 'var(--red)' }} onClick={onFail}>
              Báo cáo sự cố
            </button>
          ) : (
            <button className="op-btn op-btn-primary" onClick={onPass}>
              Tiếp tục tới buồng lái →
            </button>
          )}
        </div>
      )}

      {!allAnswered && (
        <div style={{ fontSize: 13, color: 'var(--text-3)', padding: '8px 0' }}>
          {answered}/{total} mục đã kiểm tra · Hoàn tất các mục còn lại
        </div>
      )}
    </div>
  )
}
