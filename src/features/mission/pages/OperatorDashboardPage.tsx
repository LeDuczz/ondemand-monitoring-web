import { useState, useEffect } from 'react'
import type {
  Mission,
  PreflightCheck,
  FlightToken,
  DeviceStatus,
} from '../types/mission'
import { missionApi } from '../api/missionApi'
import {
  MissionStatusBadge,
  DeviceStatusBadge,
} from '../components/MissionStatusBadge'
import { PreflightDiagnosticCard } from '../components/PreflightDiagnosticCard'
import { FlightTelemetryHUD } from '../components/FlightTelemetryHUD'
import { PostflightModal } from '../components/PostflightModal'
import { Button } from '../../../shared/components/Button'
import { Icon } from '../../../shared/components/Icon'

export function OperatorDashboardPage() {
  const [mission, setMission] = useState<Mission | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus>('AVAILABLE')
  const [preflightCheck, setPreflightCheck] = useState<PreflightCheck | null>(
    null,
  )
  const [flightToken, setFlightToken] = useState<FlightToken | null>(null)
  const [isGcsConnected, setIsGcsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isPostflightOpen, setIsPostflightOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [showReplaceModal, setShowReplaceModal] = useState(false)
  const [newDeviceCode, setNewDeviceCode] = useState('DRONE-02')

  // Telemetry Mock Controls
  const [batteryLevel, setBatteryLevel] = useState(95)
  const [gpsSatellites, setGpsSatellites] = useState(12)

  // Fetch mission strictly from Backend API on mount
  useEffect(() => {
    setLoading(true)
    setError(null)
    missionApi
      .getMissionById('M-001')
      .then((fetched) => {
        setMission(fetched)
      })
      .catch((err) => {
        setError((err as Error).message)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div
        style={{
          background: 'var(--color-background)',
          minHeight: '100vh',
          padding: '60px 0',
          textAlign: 'center',
        }}
      >
        <div className="container">
          <p className="eyebrow">LOADING MISSION DATA FROM BACKEND API...</p>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              margin: '20px 0',
            }}
          >
            <Icon
              name="clock"
              style={{ animation: 'spin 1s linear infinite' }}
            />
            <span>
              Đang kết nối backend server
              http://localhost:8080/api/missions/M-001...
            </span>
          </div>
        </div>
      </div>
    )
  }

  if (error || !mission) {
    return (
      <div
        style={{
          background: 'var(--color-background)',
          minHeight: '100vh',
          padding: '60px 0',
        }}
      >
        <div
          className="container"
          style={{ maxWidth: '600px', margin: '0 auto' }}
        >
          <div
            className="card"
            style={{
              padding: '32px',
              borderColor: '#fca5a5',
              background:
                'color-mix(in srgb, #991b1b 5%, var(--color-surface))',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                color: '#b91c1c',
                marginBottom: '16px',
              }}
            >
              <Icon name="x" style={{ width: '28px', height: '28px' }} />
              <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>
                Không thể kết nối Backend API
              </h2>
            </div>
            <p
              style={{
                margin: '0 0 20px',
                fontSize: '0.88rem',
                color: 'var(--color-foreground)',
                lineHeight: 1.6,
              }}
            >
              Lỗi: <strong>{error || 'Mission M-001 không tồn tại'}</strong>.
              Hãy đảm bảo Spring Boot server đang khởi chạy tại{' '}
              <code>http://localhost:8080</code>.
            </p>
            <Button
              variant="primary"
              icon="route"
              onClick={() => window.location.reload()}
            >
              Thử lại (Reload)
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Calculate current flow step number (1 to 4)
  const getStepNumber = () => {
    switch (mission.status) {
      case 'WAITING_OPERATOR_ACCEPTANCE':
        return 1
      case 'SCHEDULED':
      case 'CONNECTED':
      case 'PREFLIGHT_CHECKING':
      case 'READY_TO_FLY':
      case 'FAILED_PREFLIGHT':
      case 'PENDING_APPROVAL':
        return 2
      case 'IN_FLIGHT':
      case 'IN_PROGRESS':
      case 'RETURNING':
        return 3
      case 'POSTFLIGHT_CHECKING':
      case 'COMPLETED':
        return 4
      default:
        return 1
    }
  }

  const currentStep = getStepNumber()

  // ---------------------------------------------------------------------------
  // Flow 3 Pure Backend API Handlers (No Demo Fallbacks)
  // ---------------------------------------------------------------------------

  const handleAccept = async () => {
    try {
      const updated = await missionApi.acceptMission(
        mission.id,
        mission.operatorId || 'OP-001',
      )
      setMission(updated)
    } catch (err) {
      alert(`[Lỗi API Accept]: ${(err as Error).message}`)
    }
  }

  const handleReject = async () => {
    try {
      const updated = await missionApi.rejectMission(
        mission.id,
        mission.operatorId || 'OP-001',
        rejectReason || 'Lý do cá nhân',
      )
      setMission(updated)
      setShowRejectModal(false)
    } catch (err) {
      alert(`[Lỗi API Reject]: ${(err as Error).message}`)
    }
  }

  const handleConnectGcs = async () => {
    setIsConnecting(true)
    try {
      const updated = await missionApi.connectGcs(mission.id)
      setMission(updated)
      setIsGcsConnected(true)
      setDeviceStatus('PREFLIGHT')
    } catch (err) {
      alert(`[Lỗi API Connect GCS]: ${(err as Error).message}`)
    } finally {
      setIsConnecting(false)
    }
  }

  const handleRunPreflight = async () => {
    setIsConnecting(true)
    try {
      const check = await missionApi.runPreflightCheck(
        mission.id,
        mission.deviceCode || 'DRONE-01',
      )
      setPreflightCheck(check)

      // Refresh mission state from backend
      const updated = await missionApi.getMissionById(mission.id)
      setMission(updated)

      if (check.overallPassed && check.flightToken) {
        setFlightToken(check.flightToken)
      }
    } catch (err) {
      alert(`[Lỗi API Pre-flight Check]: ${(err as Error).message}`)
    } finally {
      setIsConnecting(false)
    }
  }

  const handleReplaceDrone = async () => {
    try {
      const updated = await missionApi.replaceDrone(mission.id, newDeviceCode)
      setMission(updated)
      setDeviceStatus('PREFLIGHT')
      setPreflightCheck(null)
      setFlightToken(null)
      setShowReplaceModal(false)
    } catch (err) {
      alert(`[Lỗi API Replace Drone]: ${(err as Error).message}`)
    }
  }

  const handleStartMission = async () => {
    try {
      const updated = await missionApi.startMission(
        mission.id,
        flightToken?.tokenValue,
      )
      setMission(updated)
      setDeviceStatus('ACTIVE_MISSION')
    } catch (err) {
      alert(`[Lỗi API Start Mission]: ${(err as Error).message}`)
    }
  }

  const handleUploadMedia = async (file: File) => {
    setIsUploading(true)
    try {
      await missionApi.uploadMedia(
        mission.id,
        mission.deviceCode || 'DRONE-01',
        file,
      )
      alert('Tải tệp hình ảnh/video lên S3 thành công!')
    } catch (err) {
      alert(`[Lỗi API Upload Media]: ${(err as Error).message}`)
    } finally {
      setIsUploading(false)
    }
  }

  const handleMarkReturning = async () => {
    try {
      const updated = await missionApi.markReturning(mission.id)
      setMission(updated)
    } catch (err) {
      alert(`[Lỗi API Mark Returning]: ${(err as Error).message}`)
    }
  }

  const handlePostflightSubmit = async (
    status: DeviceStatus,
    notes: string,
  ) => {
    try {
      const updated = await missionApi.postFlightStatus(
        mission.id,
        mission.deviceCode || 'DRONE-01',
        status,
        notes,
      )
      setMission(updated)
      setDeviceStatus(status)
      setIsPostflightOpen(false)
    } catch (err) {
      alert(`[Lỗi API Post-flight Status]: ${(err as Error).message}`)
    }
  }

  return (
    <div
      style={{
        background: 'var(--color-background)',
        minHeight: '100vh',
        padding: '36px 0 80px',
      }}
    >
      <div className="container">
        {/* Operator Hero Card */}
        <div className="operator-hero">
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: '20px',
            }}
          >
            <div>
              <p className="eyebrow" style={{ margin: '0 0 6px' }}>
                FLOW 3 — DRONE OPERATOR MANAGEMENT SYSTEM
              </p>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  marginBottom: '8px',
                }}
              >
                <h1
                  style={{
                    margin: 0,
                    fontSize: '1.9rem',
                    fontWeight: 800,
                    letterSpacing: '-0.04em',
                  }}
                >
                  Nhiệm vụ {mission.missionCode}
                </h1>
                <MissionStatusBadge status={mission.status} />
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: '0.88rem',
                  color: 'var(--color-body)',
                  lineHeight: 1.6,
                }}
              >
                Địa điểm: <strong>{mission.address}</strong> | Phân công:{' '}
                <strong>{mission.operatorId}</strong> | Thiết bị:{' '}
                <strong>{mission.deviceCode}</strong>
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--color-muted)',
                  fontWeight: 600,
                }}
              >
                Trạng thái Drone:
              </span>
              <DeviceStatusBadge status={deviceStatus} />
            </div>
          </div>
        </div>

        {/* Flow Step Tracker Bar */}
        <div className="flow-step-tracker">
          <div
            className={`flow-step-node ${currentStep >= 1 ? 'flow-step-node--active' : ''} ${currentStep > 1 ? 'flow-step-node--done' : ''}`}
          >
            <span className="flow-step-number">
              {currentStep > 1 ? '✓' : '1'}
            </span>
            <div className="flow-step-label">
              <strong>F3.1 Tiếp nhận</strong>
              <small>Accept / Reject</small>
            </div>
          </div>

          <div className="flow-step-divider" />

          <div
            className={`flow-step-node ${currentStep >= 2 ? 'flow-step-node--active' : ''} ${currentStep > 2 ? 'flow-step-node--done' : ''}`}
          >
            <span className="flow-step-number">
              {currentStep > 2 ? '✓' : '2'}
            </span>
            <div className="flow-step-label">
              <strong>F3.2 Digital Pre-flight</strong>
              <small>Diagnostics & Token</small>
            </div>
          </div>

          <div className="flow-step-divider" />

          <div
            className={`flow-step-node ${currentStep >= 3 ? 'flow-step-node--active' : ''} ${currentStep > 3 ? 'flow-step-node--done' : ''}`}
          >
            <span className="flow-step-number">
              {currentStep > 3 ? '✓' : '3'}
            </span>
            <div className="flow-step-label">
              <strong>F3.3 Điều khiển Bay</strong>
              <small>Live HUD & Upload</small>
            </div>
          </div>

          <div className="flow-step-divider" />

          <div
            className={`flow-step-node ${currentStep >= 4 ? 'flow-step-node--active' : ''}`}
          >
            <span className="flow-step-number">4</span>
            <div className="flow-step-label">
              <strong>F3.4 Hoàn thành</strong>
              <small>Post-flight Inspection</small>
            </div>
          </div>
        </div>

        {/* Telemetry Indicator */}
        <div className="mock-test-bar">
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--color-primary)',
                fontWeight: 700,
                fontSize: '0.8rem',
              }}
            >
              <Icon name="activity" /> BẢNG THEO DÕI THÔNG SỐ TELEMETRY THỜI
              GIAN THỰC:
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <label
                style={{
                  fontSize: '0.78rem',
                  color: 'var(--color-foreground)',
                  fontWeight: 700,
                }}
              >
                🔋 Pin:{' '}
                <span
                  className="mono"
                  style={{ color: batteryLevel >= 80 ? '#15803d' : '#b91c1c' }}
                >
                  {batteryLevel}%
                </span>
                <input
                  type="range"
                  min="30"
                  max="100"
                  value={batteryLevel}
                  onChange={(e) => setBatteryLevel(Number(e.target.value))}
                  style={{
                    marginLeft: '10px',
                    verticalAlign: 'middle',
                    cursor: 'pointer',
                  }}
                />
              </label>

              <label
                style={{
                  fontSize: '0.78rem',
                  color: 'var(--color-foreground)',
                  fontWeight: 700,
                }}
              >
                🛰️ Vệ tinh GPS:{' '}
                <span
                  className="mono"
                  style={{ color: gpsSatellites >= 8 ? '#15803d' : '#b91c1c' }}
                >
                  {gpsSatellites}
                </span>
                <input
                  type="range"
                  min="4"
                  max="18"
                  value={gpsSatellites}
                  onChange={(e) => setGpsSatellites(Number(e.target.value))}
                  style={{
                    marginLeft: '10px',
                    verticalAlign: 'middle',
                    cursor: 'pointer',
                  }}
                />
              </label>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* PHASE 1: ACCEPTANCE GATE (F3.1) */}
        {/* ------------------------------------------------------------------ */}
        {mission.status === 'WAITING_OPERATOR_ACCEPTANCE' && (
          <div
            className="card"
            style={{ padding: '32px', marginBottom: '32px' }}
          >
            <div style={{ marginBottom: '24px' }}>
              <p
                className="eyebrow"
                style={{ margin: '0 0 4px', fontSize: '0.65rem' }}
              >
                F3.1 OPERATOR ACCEPTANCE GATE
              </p>
              <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800 }}>
                Xác nhận Tiếp nhận Nhiệm vụ Giám sát
              </h2>
              <p className="section-copy" style={{ marginTop: '8px' }}>
                Quản lý vừa phân công nhiệm vụ{' '}
                <strong>{mission.missionCode}</strong> cho bạn. Vui lòng kiểm
                tra thông tin địa điểm và thời gian để xác nhận tiếp nhận.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <Button
                variant="primary"
                icon="check"
                onClick={handleAccept}
                style={{ backgroundColor: '#15803d', padding: '0 32px' }}
              >
                CHẤP NHẬN NHIỆM VỤ (ACCEPT)
              </Button>

              <Button
                variant="secondary"
                icon="x"
                onClick={() => setShowRejectModal(true)}
                style={{ color: '#b91c1c', borderColor: '#fca5a5' }}
              >
                Từ chối (Reject)
              </Button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* PHASE 2 & 3: GCS CONNECT & PREFLIGHT DIAGNOSTICS (F3.2) */}
        {/* ------------------------------------------------------------------ */}
        {(mission.status === 'SCHEDULED' ||
          mission.status === 'CONNECTED' ||
          mission.status === 'READY_TO_FLY' ||
          mission.status === 'PENDING_APPROVAL') && (
          <div style={{ marginBottom: '32px' }}>
            <PreflightDiagnosticCard
              check={preflightCheck}
              token={flightToken}
              batteryLevel={batteryLevel}
              gpsSatellites={gpsSatellites}
              isConnecting={isConnecting}
              onRunPreflight={handleRunPreflight}
              onConnectGcs={handleConnectGcs}
              isGcsConnected={isGcsConnected || mission.status !== 'SCHEDULED'}
            />

            <div
              style={{
                marginTop: '24px',
                display: 'flex',
                gap: '16px',
                justifyContent: 'flex-end',
                flexWrap: 'wrap',
              }}
            >
              {mission.status === 'PENDING_APPROVAL' && (
                <Button
                  variant="secondary"
                  icon="route"
                  onClick={() => setShowReplaceModal(true)}
                >
                  🔄 Đổi Drone Dự Phòng (Replace Drone)
                </Button>
              )}

              {mission.status === 'READY_TO_FLY' && (
                <Button
                  variant="primary"
                  icon="arrow-up-right"
                  onClick={handleStartMission}
                  style={{
                    minHeight: '52px',
                    padding: '0 40px',
                    backgroundColor: '#15803d',
                    fontSize: '0.95rem',
                    fontWeight: 800,
                    boxShadow: '0 10px 25px rgba(21, 128, 61, 0.3)',
                  }}
                >
                  XÁC NHẬN CẤT CÁNH (START FLIGHT)
                </Button>
              )}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* PHASE 4: LIVE FLIGHT EXECUTION (F3.3) */}
        {/* ------------------------------------------------------------------ */}
        {(mission.status === 'IN_FLIGHT' ||
          mission.status === 'IN_PROGRESS' ||
          mission.status === 'RETURNING') && (
          <div style={{ marginBottom: '32px' }}>
            <FlightTelemetryHUD
              deviceCode={mission.deviceCode || 'DRONE-01'}
              missionId={mission.id}
              onUploadMedia={handleUploadMedia}
              onReturnToBase={handleMarkReturning}
              isUploading={isUploading}
            />

            {mission.status === 'RETURNING' && (
              <div style={{ marginTop: '24px', textAlign: 'right' }}>
                <Button
                  variant="primary"
                  icon="clipboard"
                  onClick={() => setIsPostflightOpen(true)}
                  style={{ padding: '0 32px' }}
                >
                  Mở Kiểm tra Post-flight & Hoàn thành Mission
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* PHASE 5: COMPLETED MISSION STATE */}
        {/* ------------------------------------------------------------------ */}
        {mission.status === 'COMPLETED' && (
          <div
            style={{
              background:
                'color-mix(in srgb, #166534 8%, var(--color-surface))',
              border: '1px solid #bbf7d0',
              borderRadius: '20px',
              padding: '48px 32px',
              textAlign: 'center',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#dcfce7',
                color: '#15803d',
                display: 'grid',
                placeItems: 'center',
                margin: '0 auto 20px',
              }}
            >
              <Icon name="check" style={{ width: '36px', height: '36px' }} />
            </div>
            <h2
              style={{
                margin: '0 0 10px',
                fontSize: '1.8rem',
                fontWeight: 800,
                color: '#166534',
              }}
            >
              Nhiệm vụ {mission.missionCode} Đã Hoàn Thành!
            </h2>
            <p
              className="section-copy"
              style={{ margin: '0 auto 28px', maxWidth: '520px' }}
            >
              Dữ liệu hình ảnh và nhật ký kiểm tra đã được lưu trữ an toàn.
              Drone <strong>{mission.deviceCode}</strong> đã sẵn sàng cho nhiệm
              vụ tiếp theo.
            </p>
          </div>
        )}

        {/* Modals */}
        {showRejectModal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(2, 6, 23, 0.75)',
              backdropFilter: 'blur(6px)',
              zIndex: 100,
              display: 'grid',
              placeItems: 'center',
              padding: '16px',
            }}
          >
            <div
              style={{
                background: 'var(--color-surface)',
                borderRadius: '16px',
                padding: '32px',
                maxWidth: '460px',
                width: '100%',
                boxShadow: 'var(--shadow-xl)',
                border: '1px solid var(--color-border)',
              }}
            >
              <h3
                style={{
                  margin: '0 0 12px',
                  fontSize: '1.2rem',
                  color: 'var(--color-foreground)',
                }}
              >
                Từ chối Nhiệm vụ
              </h3>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Nhập lý do từ chối..."
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                  marginBottom: '20px',
                  background: 'var(--color-background)',
                }}
              />
              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                  justifyContent: 'flex-end',
                }}
              >
                <Button
                  variant="secondary"
                  onClick={() => setShowRejectModal(false)}
                >
                  Hủy
                </Button>
                <Button
                  variant="primary"
                  onClick={handleReject}
                  style={{ backgroundColor: '#b91c1c' }}
                >
                  Xác nhận Từ chối
                </Button>
              </div>
            </div>
          </div>
        )}

        {showReplaceModal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(2, 6, 23, 0.75)',
              backdropFilter: 'blur(6px)',
              zIndex: 100,
              display: 'grid',
              placeItems: 'center',
              padding: '16px',
            }}
          >
            <div
              style={{
                background: 'var(--color-surface)',
                borderRadius: '16px',
                padding: '32px',
                maxWidth: '460px',
                width: '100%',
                boxShadow: 'var(--shadow-xl)',
                border: '1px solid var(--color-border)',
              }}
            >
              <h3
                style={{
                  margin: '0 0 12px',
                  fontSize: '1.2rem',
                  color: 'var(--color-foreground)',
                }}
              >
                Đổi Drone Dự Phòng
              </h3>
              <select
                value={newDeviceCode}
                onChange={(e) => setNewDeviceCode(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                  marginBottom: '20px',
                  background: 'var(--color-background)',
                  fontWeight: 600,
                }}
              >
                <option value="DRONE-02">
                  DRONE-02 (PX4 Quadcopter Beta - AVAILABLE)
                </option>
                <option value="DRONE-03">
                  DRONE-03 (PX4 Hexacopter Gamma - AVAILABLE)
                </option>
              </select>
              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                  justifyContent: 'flex-end',
                }}
              >
                <Button
                  variant="secondary"
                  onClick={() => setShowReplaceModal(false)}
                >
                  Hủy
                </Button>
                <Button variant="primary" onClick={handleReplaceDrone}>
                  Xác nhận Đổi Drone
                </Button>
              </div>
            </div>
          </div>
        )}

        <PostflightModal
          isOpen={isPostflightOpen}
          onClose={() => setIsPostflightOpen(false)}
          onSubmit={handlePostflightSubmit}
          isSubmitting={isConnecting}
        />
      </div>
    </div>
  )
}
