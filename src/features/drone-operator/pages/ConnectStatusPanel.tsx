import { StatusBadge } from '../../../shared/components/odm/StatusBadge'
import { operatorHref } from '../routes'
import type { ConnectState } from './ConnectDroneScreen'
import type { BackendMission } from '../api/liveMission'

const TRACKER_STEPS = [
  'Xác thực operator',
  'Mở liên kết tới GCS',
  'Nhận heartbeat telemetry',
]

export function ConnectStatusPanel({
  state,
  error,
  mission,
}: {
  state: ConnectState
  error: string | null
  mission?: BackendMission
}) {
  const doneCount =
    state === 'connected'
      ? 3
      : state === 'connecting'
        ? 1
        : state === 'failed'
          ? 1
          : 0
  const activeIndex = state === 'connecting' ? 1 : -1
  const failedIndex = state === 'failed' ? 1 : -1

  const badgeTone =
    state === 'connected'
      ? 'green'
      : state === 'connecting'
        ? 'blue'
        : state === 'failed'
          ? 'red'
          : 'gray'
  const badgeLabel =
    state === 'connected'
      ? 'Đã kết nối'
      : state === 'connecting'
        ? 'Đang kết nối'
        : state === 'failed'
          ? 'Thất bại'
          : 'Chưa kết nối'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="odm-card">
        <div
          className="odm-card-body"
          style={{
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span
              className="odm-mono"
              style={{ fontWeight: 700, fontSize: 13 }}
            >
              {mission?.missionCode ?? mission?.id ?? 'Chưa chọn mission'}
            </span>
            <StatusBadge tone="green">Đã nhận</StatusBadge>
          </div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>
            {mission?.orderTitle ?? 'Mission đang được gán'}
          </div>
          <div
            style={{
              color: 'var(--tx2)',
              fontSize: 12.5,
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
            }}
          >
            <span>{mission?.scheduledStartAt ? new Date(mission.scheduledStartAt).toLocaleString('vi-VN') : 'Chưa có lịch bay'}</span>
            <span>{mission?.droneCode ?? 'Chưa gán drone'}</span>
            <span>{mission?.address ?? 'Chưa có địa chỉ'}</span>
          </div>
        </div>
      </div>

      {state === 'expired' ? (
        <div
          className="odm-card"
          style={{
            background: 'var(--red-bg)',
            borderColor: 'var(--red-dot)',
            color: 'var(--red-fg)',
          }}
        >
          <div
            className="odm-card-body"
            style={{
              padding: '16px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 15 }}>
              Mã kết nối đã hết hạn
            </div>
            <div style={{ fontSize: 12.5 }}>
              Mã flight_token chỉ có hiệu lực 10 phút. Yêu cầu quản lý cấp mã
              mới rồi nhập lại.
            </div>
          </div>
        </div>
      ) : (
        <div className="odm-card">
          <div className="odm-card-body" style={{ padding: '16px 18px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontWeight: 700, fontSize: 14 }}>
                Trạng thái kết nối
              </span>
              <StatusBadge tone={badgeTone}>{badgeLabel}</StatusBadge>
            </div>
            <div style={{ marginTop: 6 }}>
              {TRACKER_STEPS.map((label, i) => {
                const done = i < doneCount
                const active = i === activeIndex
                const failedHere = i === failedIndex
                return (
                  <div
                    key={label}
                    style={{
                      display: 'flex',
                      gap: 12,
                      alignItems: 'flex-start',
                      padding: '7px 0',
                    }}
                  >
                    <span
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flex: 'none',
                        background: failedHere
                          ? 'var(--red-solid)'
                          : done
                            ? 'var(--green-solid)'
                            : active
                              ? 'var(--blue-solid)'
                              : 'var(--gray-bg)',
                        color: failedHere
                          ? 'var(--red-on)'
                          : done
                            ? 'var(--green-on)'
                            : active
                              ? 'var(--blue-on)'
                              : 'var(--gray-fg)',
                      }}
                    >
                      {failedHere ? '✕' : done ? '✓' : active ? '…' : '○'}
                    </span>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 13.5,
                        color:
                          done || failedHere || active
                            ? undefined
                            : 'var(--tx3)',
                      }}
                    >
                      {label}
                    </div>
                  </div>
                )
              })}
            </div>
            {state === 'failed' && error ? (
              <div
                style={{
                  marginTop: 8,
                  padding: '10px 12px',
                  borderRadius: 10,
                  background: 'var(--red-bg)',
                  color: 'var(--red-fg)',
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 600 }}>
                  disconnect_reason
                </div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{error}</div>
              </div>
            ) : null}
            {state === 'connected' ? (
              <div
                style={{
                  marginTop: 8,
                  padding: '10px 12px',
                  borderRadius: 10,
                  background: 'var(--green-bg)',
                  color: 'var(--green-fg)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontWeight: 700,
                    fontSize: 12.5,
                  }}
                >
                  <span>Heartbeat telemetry</span>
                  <span className="odm-mono">10 Hz</span>
                </div>
                <div style={{ fontSize: 12, marginTop: 4 }}>
                  telemetry_active = TRUE · pin drone 100% · 18 vệ tinh
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {state === 'connected' ? (
        <a
          className="odm-btn odm-btn-p"
          href={operatorHref({ screen: 'preflight', missionId: mission?.id })}
          style={{ width: '100%' }}
        >
          Tiếp tục: precheck
        </a>
      ) : (
        <a
          className="odm-btn"
          href={operatorHref({ screen: 'missions' })}
          style={{ width: '100%' }}
        >
          Quay lại mission
        </a>
      )}
    </div>
  )
}
