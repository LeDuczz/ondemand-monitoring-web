import { useState } from 'react'

import { missionApi } from '../../mission/api/missionApi'
import { useActiveMission } from '../api/useActiveMission'
import { backendPreflightTokenStorageKey, preflightReadyStorageKey } from '../lib/flightWorkflowStorage'
import { flightControlApi } from '../omss/api/flightControlApi'
import { operatorHref } from '../routes'
import { FlightStepHeader } from './FlightStepper'
import { ConfirmedBanner, RevokedBanner } from './HandoverBanners'


const COMMITMENTS = [
  'Tôi đã kiểm tra khu vực bay, không có người và phương tiện trong vùng an toàn, và tuân thủ mọi vùng cấm bay được cảnh báo trong mission.',
  'Tôi giữ drone trong tầm nhìn khi có thể, không bay quá độ cao 120 m và không vượt bán kính vùng giám sát 500 m.',
  'Tôi sẵn sàng bấm RTL hoặc LAND ngay khi có cảnh báo pin thấp, mất telemetry hoặc thời tiết xấu.',
  'Tôi chịu trách nhiệm an toàn vận hành từ lúc xác nhận cho tới khi drone hạ cánh và tắt động cơ.',
]

/** OPR-05W — Bàn giao quyền điều khiển: 4 cam kết + tick tổng + xác nhận. */
export function HandoverScreen({ missionId }: { missionId?: string }) {
  const mission = useActiveMission(missionId)
  const missionLabel = mission.data?.missionCode ?? mission.missionId ?? 'Chưa chọn mission'
  const [revoked, setRevoked] = useState(false)
  const [checked, setChecked] = useState<boolean[]>([
    false,
    false,
    false,
    false,
  ])
  const [ack, setAck] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const allChecked = checked.every(Boolean)
  const canConfirm = allChecked && ack && !submitting

  async function handleConfirm() {
    setSubmitting(true)
    setError(null)
    try {
      if (!mission.missionId || !mission.data?.droneCode) throw new Error('Chọn mission đã gán drone trước khi tiếp tục')
      const droneCode = mission.data.droneCode
      const storedToken = window.sessionStorage.getItem(backendPreflightTokenStorageKey(mission.missionId, droneCode))
      if (!storedToken && mission.data.status !== 'READY_TO_FLY') {
        throw new Error('Vui lòng chạy precheck thành công trước khi bàn giao')
      }
      window.sessionStorage.setItem(`fieldwise.operator.handoverAcknowledged.${mission.missionId}`, 'true')
      await flightControlApi.bindSession(mission.missionId, droneCode)
      await missionApi.handoverMyMission(mission.missionId)
      await missionApi.startMission(mission.missionId, storedToken ?? undefined)
      window.sessionStorage.removeItem(backendPreflightTokenStorageKey(mission.missionId, droneCode))
      window.localStorage.setItem(preflightReadyStorageKey(mission.data.missionCode ?? mission.missionId, droneCode), 'true')
      window.localStorage.setItem(preflightReadyStorageKey(mission.missionId, droneCode), 'true')
      window.sessionStorage.setItem('odm.operator.autoStartSimulation', 'true')
      setConfirmed(true)
      window.location.hash = operatorHref({ screen: 'flight', missionId: mission.missionId })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không xác nhận được cam kết')
    } finally {
      setSubmitting(false)
    }
  }

  function handleRevoke() {
    if (mission.missionId) window.sessionStorage.removeItem(`fieldwise.operator.handoverAcknowledged.${mission.missionId}`)
    setRevoked(true)
    setConfirmed(false)
    setAck(false)
    setChecked([false, false, false, false])
  }

  return (
    <div className="odm-card" style={{ marginBottom: 0 }}>
      <FlightStepHeader
        title="Bàn giao quyền điều khiển"
        missionId={missionLabel}
        active={4}
      />
      <div style={{ padding: '18px 22px', maxWidth: 800, margin: '0 auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {error && <p role="alert" style={{ color: 'var(--red-fg)' }}>{error}</p>}
          <DroneStrip missionLabel={missionLabel} droneLabel={mission.data?.droneCode ?? 'Chưa gán drone'} />

          {revoked ? (
            <RevokedBanner onReconfirm={() => setRevoked(false)} />
          ) : confirmed ? (
            <ConfirmedBanner missionId={mission.missionId} onRevoke={handleRevoke} />
          ) : (
            <>
              <div className="odm-card">
                <div className="odm-card-body" style={{ padding: '18px 22px' }}>
                  <div
                    style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}
                  >
                    Cam kết an toàn trước khi nhận quyền điều khiển
                  </div>
                  <div
                    className="odm-mono"
                    style={{
                      fontSize: 11.5,
                      color: 'var(--tx3)',
                      marginBottom: 12,
                    }}
                  >
                    control_handover.acknowledgement_text
                  </div>
                  <ol
                    style={{
                      margin: 0,
                      padding: 0,
                      listStyle: 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                    }}
                  >
                    {COMMITMENTS.map((text, i) => (
                      <li
                        key={i}
                        style={{
                          display: 'flex',
                          gap: 12,
                          fontSize: 13.5,
                          lineHeight: 1.5,
                        }}
                      >
                        <label
                          style={{
                            display: 'flex',
                            gap: 12,
                            cursor: 'pointer',
                            width: '100%',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={checked[i]}
                            onChange={(e) => {
                              const next = [...checked]
                              next[i] = e.target.checked
                              setChecked(next)
                            }}
                            style={{ marginTop: 2, flex: 'none' }}
                          />
                          <span>{text}</span>
                        </label>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setAck((v) => !v)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  display: 'flex',
                  gap: 14,
                  alignItems: 'center',
                  padding: '14px 16px',
                  borderRadius: 12,
                  border: `2px solid ${ack ? 'var(--green-dot)' : 'var(--bd2)'}`,
                  background: ack ? 'var(--green-bg)' : 'var(--sf)',
                  cursor: 'pointer',
                  font: 'inherit',
                  color: 'inherit',
                }}
              >
                <span
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 8,
                    flex: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: ack ? 'none' : '3px solid var(--bd2)',
                    background: ack ? 'var(--green-solid)' : 'transparent',
                    color: 'var(--green-on)',
                  }}
                >
                  {ack ? '✓' : null}
                </span>
                <span style={{ fontSize: 15, fontWeight: 700 }}>
                  Tôi xác nhận đã kiểm soát drone và chịu trách nhiệm vận hành
                </span>
              </button>

              <div style={{ display: 'flex', gap: 12 }}>
                <a
                  className="odm-btn"
                  href={operatorHref({ screen: 'preflight', missionId: mission.missionId })}
                  style={{ minWidth: 150 }}
                >
                  Quay lại
                </a>
                <button
                  type="button"
                  className="odm-btn odm-btn-p"
                  disabled={!canConfirm}
                  onClick={handleConfirm}
                  style={{ flex: 1 }}
                >
                  {submitting ? 'Đang xử lý...' : 'Xác nhận bàn giao'}
                </button>
              </div>
              <div
                style={{
                  fontSize: 11.5,
                  color: 'var(--tx3)',
                  textAlign: 'center',
                }}
              >
                Nút xác nhận bị khoá đến khi bạn tick đủ 4 cam kết. Ghi
                control_handover.status = CONFIRMED và confirmed_at.
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
    <div
      style={{
        display: 'flex',
        gap: 14,
        alignItems: 'center',
        padding: '10px 14px',
        background: 'var(--sf)',
        border: '1px solid var(--bd)',
        borderRadius: 12,
      }}
    >
      <span
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: 'var(--sf3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 'none',
        }}
      >
        🔗
      </span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 15 }}>
          {droneLabel} · {missionLabel}
        </div>
        <div style={{ color: 'var(--tx3)', fontSize: 12.5 }}>
          Đã kết nối GCS DJI-RC-PLUS-7A31 lúc 13:26:41 · telemetry hoạt động
        </div>
      </div>
      <span className="odm-badge odm-badge-green odm-badge-lg">
        <span className="odm-badge-dot" aria-hidden="true" />
        Đã kết nối
      </span>
    </div>
  )
}
