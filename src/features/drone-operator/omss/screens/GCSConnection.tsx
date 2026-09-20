import { useState, useEffect } from 'react'
import type { OperatorMission } from '../types'
import { StatusBadge } from '../../../../shared/components/odm/StatusBadge'

interface Props {
  mission: OperatorMission
  onConnected: () => void
  onBack: () => void
}

type ConnStatus = 'idle' | 'connecting' | 'connected' | 'failed' | 'expired'
type Step = { id: string; label: string; detail?: string; status: 'pending' | 'ok' | 'error' | 'loading' }

const GCS_DEVICES = [
  { id: 'DJI-RC-PLUS-7A31', label: 'DJI-RC-PLUS-7A31 (điều khiển cầm tay)' },
  { id: 'GCS-CLOUD-BTHANH-01', label: 'GCS-CLOUD-BTHANH-01 (trạm Bình Thạnh)' },
]

const DEVICE_CODE = 'TAB-OPR-0412'
const TOKEN_TTL = 5 * 60 // 5 minutes in seconds

export default function GCSConnection({ mission, onConnected, onBack }: Props) {
  const [token, setToken] = useState('')
  const [gcsId, setGcsId] = useState(GCS_DEVICES[0]!.id)
  const [customGcs, setCustomGcs] = useState('')
  const [useCustom, setUseCustom] = useState(false)
  const [status, setStatus] = useState<ConnStatus>('idle')
  const [remaining, setRemaining] = useState(TOKEN_TTL)
  const [steps, setSteps] = useState<Step[]>([
    { id: 'token', label: 'Xác thực mã token', status: 'pending' },
    { id: 'gcs', label: 'Mở liên kết tới GCS', status: 'pending' },
    { id: 'telemetry', label: 'Nhận heartbeat telemetry', status: 'pending' },
  ])

  useEffect(() => {
    if (status !== 'connecting' && status !== 'connected') return
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 0) { setStatus('expired'); clearInterval(id); return 0 }
        return r - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [status])

  function fmtCountdown(sec: number) {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `còn ${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  async function handleConnect() {
    if (!token.trim()) return
    setStatus('connecting')
    const finalGcs = useCustom ? customGcs : gcsId

    // Simulate 3-step connection
    const simulate = (steps: Step[], idx: number, ok: boolean) => {
      const updated = [...steps]
      updated[idx] = { ...updated[idx]!, status: 'loading' }
      setSteps([...updated])
      setTimeout(() => {
        updated[idx] = { ...updated[idx]!, status: ok ? 'ok' : 'error', detail: ok ? getStepDetail(idx, finalGcs) : 'Lỗi kết nối' }
        setSteps([...updated])
        if (idx < 2 && ok) {
          simulate(updated, idx + 1, true)
        } else if (idx === 2 && ok) {
          setStatus('connected')
        } else {
          setStatus('failed')
        }
      }, 1200)
    }
    simulate(steps, 0, true)
  }

  function getStepDetail(idx: number, gcs: string): string {
    if (idx === 0) return 'Hợp lệ ✓'
    if (idx === 1) return gcs
    return 'telemetry_active · 10 Hz'
  }

  function handleRequestNew() {
    setStatus('idle')
    setToken('')
    setRemaining(TOKEN_TTL)
    setSteps([
      { id: 'token', label: 'Xác thực mã token', status: 'pending' },
      { id: 'gcs', label: 'Mở liên kết tới GCS', status: 'pending' },
      { id: 'telemetry', label: 'Nhận heartbeat telemetry', status: 'pending' },
    ])
  }

  const STEPPER = ['Kết nối', 'Bàn giao', 'Preflight', 'Bay', 'Upload', 'Postflight']

  return (
    <div className="fade-in" style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--tx2)', fontSize: 13, cursor: 'pointer', padding: 0, marginBottom: 16 }}>
        ← Quay lại
      </button>

      <div style={{ fontSize: 12, color: 'var(--tx3)', marginBottom: 4 }}>
        Kết nối drone · <span style={{ fontFamily: 'var(--font-data)' }}>{mission.id}</span>
      </div>

      {/* Stepper */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 24, overflowX: 'auto' }}>
        {STEPPER.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 6,
              background: i === 0 ? 'var(--blue-solid)' : 'var(--sf2)',
              color: i === 0 ? '#fff' : 'var(--tx3)',
              fontSize: 12, fontWeight: i === 0 ? 600 : 400,
            }}>
              <span style={{
                width: 18, height: 18, borderRadius: '50%',
                background: i === 0 ? 'rgba(255,255,255,.25)' : 'var(--bd)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 700,
              }}>{i + 1}</span>
              {s}
            </div>
            {i < STEPPER.length - 1 && <div style={{ width: 20, height: 1, background: 'var(--bd)' }} />}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24, alignItems: 'start' }}>
        {/* Mission card */}
        <div style={{ background: 'var(--sf)', border: '1px solid var(--bd)', borderRadius: 10, padding: '16px' }}>
          <div style={{ fontSize: 11, color: 'var(--tx3)', fontFamily: 'var(--font-data)', marginBottom: 6 }}>{mission.id}</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--tx)', marginBottom: 10, lineHeight: 1.3 }}>{mission.title}</div>
          <div style={{ fontSize: 12, color: 'var(--tx2)', marginBottom: 4 }}>{mission.location}</div>
          <div style={{ fontSize: 12, color: 'var(--tx2)' }}>{mission.droneId} {mission.droneName}</div>
        </div>

        {/* Connect form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Step 1: Token */}
          <div style={{ background: 'var(--sf)', border: '1px solid var(--bd)', borderRadius: 10, padding: '20px' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--tx)', marginBottom: 4 }}>
              1. Nhập hoặc quét mã flight_token
            </div>
            <div style={{ fontSize: 12, color: 'var(--tx3)', marginBottom: 12 }}>
              device_code: <code style={{ fontFamily: 'var(--font-data)' }}>{DEVICE_CODE}</code>
              {status !== 'idle' && status !== 'expired' && (
                <span style={{ marginLeft: 12, color: remaining < 60 ? 'var(--red-solid)' : 'var(--tx2)' }}>{fmtCountdown(remaining)}</span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="odm-input"
                placeholder="Nhập flight_token..."
                value={token}
                onChange={(e) => setToken(e.target.value)}
                disabled={status === 'connecting' || status === 'connected'}
                style={{ flex: 1, fontFamily: 'var(--font-data)', fontSize: 13 }}
              />
              <button className="odm-btn odm-btn-gh" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                Quét QR
              </button>
            </div>
          </div>

          {/* Step 2: GCS */}
          <div style={{ background: 'var(--sf)', border: '1px solid var(--bd)', borderRadius: 10, padding: '20px' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--tx)', marginBottom: 12 }}>
              2. Chọn hoặc nhập gcs_identifier
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
              {GCS_DEVICES.map((d) => (
                <label key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="gcs"
                    value={d.id}
                    checked={!useCustom && gcsId === d.id}
                    onChange={() => { setGcsId(d.id); setUseCustom(false) }}
                    disabled={status === 'connecting' || status === 'connected'}
                    style={{ accentColor: 'var(--blue-solid)' }}
                  />
                  <span style={{ fontFamily: 'var(--font-data)', fontSize: 12 }}>{d.label}</span>
                </label>
              ))}
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="gcs"
                  checked={useCustom}
                  onChange={() => setUseCustom(true)}
                  disabled={status === 'connecting' || status === 'connected'}
                  style={{ accentColor: 'var(--blue-solid)' }}
                />
                Nhập mã khác...
              </label>
            </div>
            {useCustom && (
              <input
                className="odm-input"
                placeholder="gcs_identifier"
                value={customGcs}
                onChange={(e) => setCustomGcs(e.target.value)}
                style={{ fontFamily: 'var(--font-data)', fontSize: 12 }}
              />
            )}
          </div>

          {/* Connect button */}
          {(status === 'idle' || status === 'failed') && (
            <button
              className="odm-btn odm-btn-p"
              onClick={handleConnect}
              disabled={!token.trim()}
            >
              Kết nối
            </button>
          )}

          {status === 'expired' && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: '#991b1b' }}>Mã đã hết hạn</span>
              <button className="odm-btn odm-btn-gh" style={{ fontSize: 12 }} onClick={handleRequestNew}>Yêu cầu mã mới</button>
            </div>
          )}

          {/* Connection status tracker */}
          {(status === 'connecting' || status === 'connected' || status === 'failed') && (
            <div style={{ background: 'var(--sf)', border: '1px solid var(--bd)', borderRadius: 10, padding: '16px 20px' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--tx)', marginBottom: 12 }}>Trạng thái kết nối</div>
              {steps.map((step) => (
                <div key={step.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <span style={{ fontSize: 16 }}>
                    {step.status === 'ok' ? '✅' : step.status === 'error' ? '❌' : step.status === 'loading' ? '⏳' : '⬜'}
                  </span>
                  <div>
                    <div style={{ fontSize: 13, color: 'var(--tx)' }}>{step.label}</div>
                    {step.detail && <div style={{ fontSize: 12, color: 'var(--tx3)', fontFamily: 'var(--font-data)' }}>{step.detail}</div>}
                  </div>
                </div>
              ))}

              {status === 'connected' && (
                <div style={{ marginTop: 12 }}>
                  <StatusBadge tone="green">Đã kết nối</StatusBadge>
                  <div style={{ marginTop: 12 }}>
                    <button className="odm-btn odm-btn-p" onClick={onConnected}>
                      Tiếp tục: bàn giao quyền điều khiển →
                    </button>
                  </div>
                </div>
              )}

              {status === 'failed' && (
                <button className="odm-btn odm-btn-gh" style={{ marginTop: 8 }} onClick={handleRequestNew}>Thử lại</button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
