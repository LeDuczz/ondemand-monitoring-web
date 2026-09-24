import { useState } from 'react'

import { useActiveMission } from '../api/useActiveMission'
import { operatorHref } from '../routes'
import { FlightStepHeader } from './FlightStepper'

const COMMITMENT_TEXT =
  'Tôi xác nhận đã kiểm tra toàn bộ điều kiện bay, đảm bảo an toàn khu vực, ' +
  'tuân thủ quy định vùng cấm, giữ drone trong tầm nhìn và sẵn sàng xử lý ' +
  'mọi tình huống khẩn cấp. Tôi chịu trách nhiệm hoàn toàn về vận hành drone ' +
  'từ lúc xác nhận cho tới khi drone hạ cánh và tắt động cơ.'

export function HandoverScreen() {
  const mission = useActiveMission()
  const missionLabel = mission.data?.missionCode ?? mission.missionId ?? 'Chưa chọn mission'
  const droneLabel = mission.data?.droneCode ?? 'Chưa gán drone'
  const [showPopup, setShowPopup] = useState(false)
  const [confirmed, setConfirmed] = useState(() => {
    if (!mission.missionId) return false
    return window.sessionStorage.getItem(`fieldwise.operator.handoverAcknowledged.${mission.missionId}`) === 'true'
  })

  function handleConfirm() {
    if (mission.missionId) {
      window.sessionStorage.setItem(`fieldwise.operator.handoverAcknowledged.${mission.missionId}`, 'true')
    }
    setConfirmed(true)
    setShowPopup(false)
  }

  return (
    <div className="odm-card" style={{ marginBottom: 0 }}>
      <FlightStepHeader title="Bàn giao quyền điều khiển" missionId={missionLabel} active={4} />
      <div style={{ padding: '18px 22px', maxWidth: 800, margin: '0 auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <DroneStrip missionLabel={missionLabel} droneLabel={droneLabel} />

          <div className="odm-card">
            <div className="odm-card-body" style={{ padding: '18px 22px' }}>
              <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>
                Cam kết an toàn trước khi nhận quyền điều khiển
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--tx2)', margin: 0 }}>
                Trước khi tiếp nhận quyền điều khiển drone, bạn cần đọc và xác nhận cam kết an toàn vận hành.
                Cam kết bao gồm: kiểm tra khu vực bay, tuân thủ vùng cấm, giữ drone trong tầm nhìn,
                sẵn sàng xử lý khẩn cấp, và chịu trách nhiệm toàn bộ quá trình bay.
              </p>
            </div>
          </div>

          {confirmed ? (
            <>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: 10, padding: '10px 14px', borderRadius: 8,
                background: 'var(--green-bg)', color: 'var(--green-fg)', border: '1px solid var(--green-dot)',
              }}>
                <span>Bạn đã xác nhận bàn giao quyền điều khiển.</span>
              </div>
              <a className="odm-btn odm-btn-p" href={operatorHref({ screen: 'flight' })} style={{ textAlign: 'center' }}>
                Vào buồng lái
              </a>
            </>
          ) : (
            <div style={{ display: 'flex', gap: 12 }}>
              <a className="odm-btn" href={operatorHref({ screen: 'preflight' })} style={{ minWidth: 150 }}>
                Quay lại
              </a>
              <button type="button" className="odm-btn odm-btn-p" onClick={() => setShowPopup(true)} style={{ flex: 1 }}>
                Tôi đã đọc
              </button>
            </div>
          )}
        </div>
      </div>

      {showPopup && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 300,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.5)',
          }}
          onClick={() => setShowPopup(false)}
        >
          <div
            style={{
              background: 'var(--sf)', borderRadius: 16, padding: '24px 28px',
              maxWidth: 480, width: '90%', boxShadow: '0 24px 70px rgba(0,0,0,0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 14 }}>
              Xác nhận cam kết an toàn
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--tx2)', margin: '0 0 20px' }}>
              {COMMITMENT_TEXT}
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="button" className="odm-btn" onClick={() => setShowPopup(false)} style={{ flex: 1 }}>
                Hủy
              </button>
              <button type="button" className="odm-btn odm-btn-p" onClick={handleConfirm} style={{ flex: 1 }}>
                Tôi đã xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
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
