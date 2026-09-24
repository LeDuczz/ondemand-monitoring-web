import { useCallback, useEffect, useRef, useState } from 'react'

import { useActiveMission } from '../api/useActiveMission'
import { operatorHref } from '../routes'
import { FlightStepHeader } from './FlightStepper'

const COMMITMENTS = [
  'Tôi đã kiểm tra khu vực bay, không có người và phương tiện trong vùng an toàn, và tuân thủ mọi vùng cấm bay được cảnh báo trong mission.',
  'Tôi giữ drone trong tầm nhìn khi có thể, không bay quá độ cao 120 m và không vượt bán kính vùng giám sát 500 m.',
  'Tôi sẵn sàng bấm RTL hoặc LAND ngay khi có cảnh báo pin thấp, mất telemetry hoặc thời tiết xấu.',
  'Tôi chịu trách nhiệm an toàn vận hành từ lúc xác nhận cho tới khi drone hạ cánh và tắt động cơ.',
]

const AUTO_TICK_DELAY_MS = 350

export function HandoverScreen() {
  const mission = useActiveMission()
  const missionLabel = mission.data?.missionCode ?? mission.missionId ?? 'Chưa chọn mission'
  const droneLabel = mission.data?.droneCode ?? 'Chưa gán drone'

  const [checked, setChecked] = useState<boolean[]>(() => Array(COMMITMENTS.length).fill(false))
  const [ackChecked, setAckChecked] = useState(false)
  const [animating, setAnimating] = useState(false)
  const [confirmed, setConfirmed] = useState(() => {
    if (!mission.missionId) return false
    return window.sessionStorage.getItem(`fieldwise.operator.handoverAcknowledged.${mission.missionId}`) === 'true'
  })
  const timerRef = useRef<number | null>(null)

  const handleAckTick = useCallback(() => {
    if (animating || confirmed) return
    setAckChecked(true)
    setAnimating(true)
  }, [animating, confirmed])

  useEffect(() => {
    if (!animating) return

    let idx = 0
    function tickNext() {
      if (idx >= COMMITMENTS.length) {
        // All ticked — confirm after a short pause
        timerRef.current = window.setTimeout(() => {
          if (mission.missionId) {
            window.sessionStorage.setItem(`fieldwise.operator.handoverAcknowledged.${mission.missionId}`, 'true')
          }
          setConfirmed(true)
          setAnimating(false)
        }, AUTO_TICK_DELAY_MS)
        return
      }
      timerRef.current = window.setTimeout(() => {
        const currentIdx = idx
        setChecked((prev) => {
          const next = [...prev]
          next[currentIdx] = true
          return next
        })
        idx++
        tickNext()
      }, AUTO_TICK_DELAY_MS)
    }

    tickNext()

    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    }
  }, [animating, mission.missionId])


  return (
    <div className="odm-card" style={{ marginBottom: 0 }}>
      <FlightStepHeader title="Bàn giao quyền điều khiển" missionId={missionLabel} active={4} />
      <div style={{ padding: '18px 22px', maxWidth: 800, margin: '0 auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <DroneStrip missionLabel={missionLabel} droneLabel={droneLabel} />

          <div className="odm-card">
            <div className="odm-card-body" style={{ padding: '18px 22px' }}>
              <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>
                Cam kết an toàn trước khi nhận quyền điều khiển
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--tx3)', marginBottom: 12 }}>
                Đọc kỹ và xác nhận bên dưới để tiếp nhận quyền điều khiển drone
              </div>
              <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {COMMITMENTS.map((text, i) => (
                  <li key={i} style={{ display: 'flex', gap: 12, fontSize: 13.5, lineHeight: 1.5 }}>
                    <label style={{ display: 'flex', gap: 12, width: '100%', cursor: animating || confirmed ? 'default' : 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={checked[i]}
                        disabled={animating || confirmed}
                        readOnly
                        style={{
                          marginTop: 2,
                          flex: 'none',
                          accentColor: 'var(--green-solid)',
                          transition: 'transform 0.25s ease',
                          transform: checked[i] ? 'scale(1.2)' : 'scale(1)',
                        }}
                      />
                      <span style={{
                        transition: 'color 0.3s ease',
                        color: checked[i] ? 'var(--green-fg)' : 'inherit',
                      }}>
                        {text}
                      </span>
                    </label>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {confirmed ? (
            <>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 10, padding: '14px 18px', borderRadius: 12,
                background: 'var(--green-bg)', color: 'var(--green-fg)', border: '1.5px solid var(--green-dot)',
                fontSize: 15, fontWeight: 700,
              }}>
                ✓ Đã xác nhận bàn giao quyền điều khiển
              </div>
              <a
                className="odm-btn odm-btn-primary"
                href={operatorHref({ screen: 'flight' })}
                style={{ textAlign: 'center', fontSize: 15, fontWeight: 700, padding: '14px 24px' }}
              >
                Vào buồng lái
              </a>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleAckTick}
                disabled={animating}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  display: 'flex',
                  gap: 14,
                  alignItems: 'center',
                  padding: '14px 16px',
                  borderRadius: 12,
                  border: `2px solid ${ackChecked ? 'var(--green-dot)' : 'var(--bd2)'}`,
                  background: ackChecked ? 'var(--green-bg)' : 'var(--sf)',
                  cursor: animating ? 'wait' : 'pointer',
                  font: 'inherit',
                  color: 'inherit',
                  transition: 'border-color 0.3s, background 0.3s',
                }}
              >
                <span style={{
                  width: 30, height: 30, borderRadius: 8, flex: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: ackChecked ? 'none' : '3px solid var(--bd2)',
                  background: ackChecked ? 'var(--green-solid)' : 'transparent',
                  color: 'var(--green-on)',
                  transition: 'all 0.3s ease',
                }}>
                  {ackChecked ? '✓' : null}
                </span>
                <span style={{ fontSize: 15, fontWeight: 700 }}>
                  Tôi đã xác nhận đã đọc và chấp nhận tất cả cam kết trên
                </span>
              </button>

              <div style={{ display: 'flex', gap: 12 }}>
                <a className="odm-btn" href={operatorHref({ screen: 'preflight' })} style={{ minWidth: 150 }}>
                  Quay lại
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function DroneStrip({ missionLabel, droneLabel }: { missionLabel: string; droneLabel: string }) {
  return (
    <div style={{
      display: 'flex', gap: 14, alignItems: 'center', padding: '10px 14px',
      background: 'var(--sf)', border: '1px solid var(--bd)', borderRadius: 12,
    }}>
      <span style={{
        width: 40, height: 40, borderRadius: 10, background: 'var(--sf3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none',
      }}>
        🔗
      </span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 15 }}>{droneLabel} · {missionLabel}</div>
        <div style={{ color: 'var(--tx3)', fontSize: 12.5 }}>Preflight đã PASS · Sẵn sàng bay</div>
      </div>
      <span className="odm-badge odm-badge-green odm-badge-lg">
        <span className="odm-badge-dot" aria-hidden="true" />
        Sẵn sàng
      </span>
    </div>
  )
}
