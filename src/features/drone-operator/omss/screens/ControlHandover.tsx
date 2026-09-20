import { useState } from 'react'
import type { OperatorMission } from '../types'
import { StatusBadge } from '../../../../shared/components/odm/StatusBadge'

interface Props {
  mission: OperatorMission
  gcsLabel?: string
  connectedAt?: string
  revoked?: boolean
  onComplete: () => void
  onBack: () => void
}

const SAFETY_ITEMS = [
  'Tôi đã kiểm tra khu vực bay, không có người và phương tiện trong vùng an toàn, và tuân thủ mọi vùng cấm bay được cảnh báo trong mission.',
  'Tôi giữ drone trong tầm nhìn khi có thể, không bay quá độ cao 120 m và không vượt bán kính vùng giám sát 500 m.',
  'Tôi sẵn sàng bấm RTL hoặc LAND ngay khi có cảnh báo pin thấp, mất telemetry hoặc thời tiết xấu.',
  'Tôi chịu trách nhiệm an toàn vận hành từ lúc xác nhận cho tới khi drone hạ cánh và tắt động cơ.',
]

export default function ControlHandover({ mission, gcsLabel, connectedAt, revoked, onComplete, onBack }: Props) {
  const [checks, setChecks] = useState<boolean[]>([false, false, false, false])
  const [confirmed, setConfirmed] = useState(false)

  const allChecked = checks.every(Boolean) && confirmed
  const gcs = gcsLabel ?? 'DJI-RC-PLUS-7A31'
  const connTime = connectedAt ?? '13:26:41'

  function toggleCheck(i: number) {
    const next = [...checks]
    next[i] = !next[i]
    setChecks(next)
  }

  return (
    <div className="fade-in" style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', maxWidth: 680 }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--tx2)', fontSize: 13, cursor: 'pointer', padding: 0, marginBottom: 16 }}>
        ← Quay lại
      </button>

      <div style={{ fontSize: 12, color: 'var(--tx3)', marginBottom: 4 }}>
        Bàn giao quyền điều khiển · <span style={{ fontFamily: 'var(--font-data)' }}>{mission.id}</span>
      </div>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--tx)', margin: '0 0 18px' }}>
        Bàn giao quyền điều khiển
      </h1>

      {/* Revoked banner */}
      {revoked && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, color: '#991b1b', fontWeight: 600 }}>⚠ Quyền điều khiển đã bị thu hồi</span>
          <button className="odm-btn odm-btn-p" style={{ fontSize: 12 }} onClick={() => setChecks([false, false, false, false])}>Xác nhận lại</button>
        </div>
      )}

      {/* Drone status strip */}
      <div style={{
        background: 'var(--sf)',
        border: '1px solid var(--bd)',
        borderRadius: 10,
        padding: '14px 18px',
        marginBottom: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
      }}>
        <div>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--tx)' }}>
            {mission.droneId} {mission.droneName} · {mission.id}
          </span>
          <div style={{ fontSize: 12, color: 'var(--tx2)', marginTop: 3 }}>
            Đã kết nối GCS {gcs} lúc {connTime} · telemetry hoạt động
          </div>
        </div>
        <StatusBadge tone="green">Đã kết nối</StatusBadge>
      </div>

      {/* Safety checklist */}
      <div style={{ background: 'var(--sf)', border: '1px solid var(--bd)', borderRadius: 10, marginBottom: 20 }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--bd)', fontSize: 14, fontWeight: 600, color: 'var(--tx)' }}>
          Cam kết an toàn bay
        </div>
        {SAFETY_ITEMS.map((item, i) => (
          <label key={i} style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
            padding: '14px 18px',
            borderBottom: i < SAFETY_ITEMS.length - 1 ? '1px solid var(--bd)' : 'none',
            cursor: 'pointer',
          }}>
            <input
              type="checkbox"
              checked={checks[i] ?? false}
              onChange={() => toggleCheck(i)}
              style={{ marginTop: 2, accentColor: 'var(--blue-solid)', flexShrink: 0 }}
            />
            <span style={{ fontSize: 13, color: 'var(--tx)', lineHeight: 1.5 }}>{item}</span>
          </label>
        ))}
      </div>

      {/* Final confirmation */}
      <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', marginBottom: 20, padding: '12px 16px', background: 'var(--sf2)', borderRadius: 8, border: '1px solid var(--bd)' }}>
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          style={{ marginTop: 2, accentColor: 'var(--blue-solid)', flexShrink: 0 }}
        />
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--tx)' }}>
          Tôi xác nhận đã kiểm soát drone và chịu trách nhiệm vận hành
        </span>
      </label>

      {/* Footer */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button className="odm-btn odm-btn-gh" onClick={onBack}>Quay lại</button>
        <button
          className="odm-btn odm-btn-p"
          onClick={onComplete}
          disabled={!allChecked}
          style={{ opacity: allChecked ? 1 : .5, flex: 1 }}
        >
          Xác nhận bàn giao
        </button>
      </div>
    </div>
  )
}
