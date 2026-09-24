import { useMemo, useState } from 'react'

import { EmptyState, LoadingState } from '../../../shared/components/odm/StateView'
import { missionApi } from '../../mission/api/missionApi'
import { useActiveMission } from '../api/useActiveMission'
import type { FlightControlStatus } from '../omss/api/flightControlApi'
import { postflightSummary } from '../lib/postflightSummary'
import { operatorHref } from '../routes'
import type {
  FaultType,
  MaintenanceSeverity,
  PostflightItem,
  PostflightItemKey,
  PreflightItemResult,
} from '../types/mission'
import { FlightStepHeader } from './FlightStepper'
import { MaintenanceTicketDialog } from './MaintenanceTicketDialog'

type PostflightCategoryDef = {
  title: string
  icon: string
  items: {
    key: PostflightItemKey
    label: string
    detail: string
    backendKeys: string[]
  }[]
}

const CATEGORIES: PostflightCategoryDef[] = [
  {
    title: 'Cấu trúc & Khung vỏ',
    icon: '🛡️',
    items: [
      {
        key: 'physical_condition_ok',
        label: 'Tình trạng vật lý & Khung vỏ',
        detail: 'Cánh quạt, chân đáp, khung thân, gimbal camera không nứt gãy',
        backendKeys: ['a1', 'a2'],
      },
    ],
  },
  {
    title: 'Hệ thống động lực & Nguồn',
    icon: '⚡',
    items: [
      {
        key: 'motor_ok',
        label: 'Động cơ & Esc',
        detail: 'Âm thanh quay đều, không quá nhiệt, không kẹt vật thể',
        backendKeys: ['p1', 'p2'],
      },
      {
        key: 'battery_ok',
        label: 'Pin & Tiếp điểm điện',
        detail: 'Không phồng rộp, nhiệt độ an toàn, tiếp điểm sạch',
        backendKeys: ['e1'],
      },
    ],
  },
  {
    title: 'Cảm biến & Payload',
    icon: '📷',
    items: [
      {
        key: 'camera_ok',
        label: 'Camera & Cảm biến giám sát',
        detail: 'Ống kính sạch, ghi hình truyền tải ổn định suốt chuyến bay',
        backendKeys: ['e2'],
      },
    ],
  },
  {
    title: 'Định vị & Liên lạc GCS',
    icon: '📡',
    items: [
      {
        key: 'gps_ok',
        label: 'Hệ thống định vị GPS / RTK',
        detail: 'Khóa vệ tinh chính xác, không mất tọa độ trong chuyến bay',
        backendKeys: ['e3'],
      },
      {
        key: 'communication_ok',
        label: 'Liên lạc Telemetry & Video Link',
        detail: 'Đường truyền GCS ổn định, không mất kết nối bất thường',
        backendKeys: ['d1'],
      },
    ],
  },
]

const ALL_KEYS = CATEGORIES.flatMap((cat) => cat.items.map((i) => i.key))

type ResultsState = Partial<Record<PostflightItemKey, PreflightItemResult>>

const postflightTelemetryKey = (missionId: string) =>
  `fieldwise.operator.postflightTelemetry.${missionId}`

function readPostflightTelemetry(missionId: string): FlightControlStatus | null {
  if (!missionId) return null
  try {
    const raw = window.sessionStorage.getItem(postflightTelemetryKey(missionId))
    if (!raw) return null
    return JSON.parse(raw) as FlightControlStatus
  } catch {
    return null
  }
}

export function PostflightScreen({ missionId }: { missionId?: string }) {
  const {
    data: activeData,
    missionId: activeId,
    loading,
    error: queryError,
    postflightMissions = [],
    selectMission,
  } = useActiveMission(missionId)

  const effectiveMissionId = activeData?.id || activeId || ''
  const missionLabel = activeData?.missionCode || effectiveMissionId || 'Nhiệm vụ'
  const droneCode = activeData?.droneCode ?? 'DRONE'

  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<ResultsState>({})
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [showTicketDialog, setShowTicketDialog] = useState(false)
  const [ticketSubmitting, setTicketSubmitting] = useState(false)
  const [ticketCreated, setTicketCreated] = useState(false)
  const [completed, setCompleted] = useState<{
    overallOk: boolean
    ticketCreated: boolean
    droneStatus: string
  } | null>(null)

  const items: PostflightItem[] = useMemo(
    () =>
      ALL_KEYS.filter((k) => results[k]).map((k) => ({
        key: k,
        result: results[k] as PreflightItemResult,
      })),
    [results],
  )

  const summary = postflightSummary(items, ALL_KEYS.length)
  const telemetrySnapshot = useMemo(
    () => readPostflightTelemetry(effectiveMissionId),
    [effectiveMissionId],
  )
  const failItems = useMemo(
    () => ALL_KEYS.filter((k) => results[k] === 'fail'),
    [results],
  )
  const allAssessed = items.length === ALL_KEYS.length

  function handleSetResult(key: PostflightItemKey, result: PreflightItemResult) {
    setResults((prev) => ({ ...prev, [key]: result }))
  }

  function handlePassAll() {
    const next: ResultsState = {}
    for (const key of ALL_KEYS) {
      next[key] = 'ok'
    }
    setResults(next)
  }

  async function handleComplete() {
    if (!effectiveMissionId) {
      setError('Không xác định được ID nhiệm vụ')
      return
    }
    if (!allAssessed) {
      setError(`Vui lòng kiểm tra và chọn ĐẠT/KHÔNG ĐẠT đủ cả ${ALL_KEYS.length} mục.`)
      return
    }

    setSaving(true)
    setError(null)

    try {
      if (activeData?.status === 'RETURNING') {
        await missionApi.startPostflight(effectiveMissionId).catch(() => {
          // Proceed if already in postflight checking state
        })
      }

      const getResult = (key: PostflightItemKey): 'PASS' | 'FAIL' =>
        results[key] === 'ok' ? 'PASS' : 'FAIL'

      const inspectionResults: Record<string, 'PASS' | 'FAIL'> = {
        a1: getResult('physical_condition_ok'),
        a2: getResult('physical_condition_ok'),
        p1: getResult('motor_ok'),
        p2: getResult('motor_ok'),
        e1: getResult('battery_ok'),
        e4: getResult('battery_ok'),
        e2: getResult('camera_ok'),
        e3: getResult('gps_ok'),
        d1: getResult('communication_ok'),
      }

      const hasFailures = failItems.length > 0
      const targetDroneStatus = hasFailures ? 'MAINTENANCE' : 'AVAILABLE'

      // Submit Postflight status to Backend
      // BE automatically creates MaintenanceTicket if targetDroneStatus is MAINTENANCE
      await missionApi.postFlightStatus(
        effectiveMissionId,
        droneCode,
        targetDroneStatus,
        notes,
        inspectionResults,
        telemetrySnapshot,
      )

      // Try marking mission completed if not automatically completed by BE
      await missionApi.completeMission(effectiveMissionId).catch(() => {
        // Ignored if BE already auto-completed on status submit
      })

      setCompleted({
        overallOk: !hasFailures,
        ticketCreated: hasFailures,
        droneStatus: targetDroneStatus,
      })
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Không thể lưu báo cáo Postflight. Vui lòng kiểm tra kết nối Server.',
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleCreateTicket(
    _issueType: FaultType,
    _severity: MaintenanceSeverity,
    description: string,
  ) {
    setTicketSubmitting(true)
    try {
      setNotes((current) =>
        [current, `[Chi tiết sự cố]: ${description}`].filter(Boolean).join('\n'),
      )
      setShowTicketDialog(false)
      setTicketCreated(true)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không ghi được ghi chú bảo trì')
    } finally {
      setTicketSubmitting(false)
    }
  }

  if (loading) return <LoadingState />

  if (queryError || !effectiveMissionId) {
    return (
      <EmptyState
        title="Không tìm thấy thông tin nhiệm vụ"
        description={String(queryError || 'Vui lòng chọn nhiệm vụ cần thực hiện Postcheck.')}
      />
    )
  }

  if (completed) {
    return (
      <div className="odm-card" style={{ marginBottom: 0 }}>
        <FlightStepHeader title="Hoàn tất kiểm tra sau bay" missionId={missionLabel} active={7} />
        <div style={{ padding: '32px 24px', maxWidth: 680, margin: '0 auto' }}>
          <div
            style={{
              padding: '28px 24px',
              borderRadius: 16,
              background: completed.overallOk
                ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.15) 100%)'
                : 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(217, 119, 6, 0.15) 100%)',
              border: `1.5px solid ${completed.overallOk ? 'var(--green-dot, #10b981)' : '#f59e0b'}`,
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  background: completed.overallOk ? '#10b981' : '#f59e0b',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 26,
                  fontWeight: 800,
                  flex: 'none',
                }}
              >
                {completed.overallOk ? '✓' : '⚠️'}
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>
                  {completed.overallOk
                    ? 'Nhiệm vụ đã hoàn thành xuất sắc!'
                    : 'Đã hoàn tất Postcheck & Khởi tạo Yêu cầu Bảo trì'}
                </h3>
                <div className="odm-mono" style={{ fontSize: 13, color: 'var(--tx2)', marginTop: 4 }}>
                  Mã nhiệm vụ: <b>{missionLabel}</b> · Thiết bị: <b>{droneCode}</b>
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: 24,
                padding: '16px 18px',
                borderRadius: 12,
                background: 'var(--sf, #fff)',
                border: '1px solid var(--bd, #e5e7eb)',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <Row label="Trạng thái nhiệm vụ" value="COMPLETED (Hoàn thành)" />
              <Row
                label="Kiểm tra vật lý sau bay"
                value={completed.overallOk ? '100% ĐẠT' : `PHÁT HIỆN BẤT THƯỜNG (${failItems.length} mục)`}
              />
              <Row
                label={`Trạng thái Drone (${droneCode})`}
                value={
                  completed.overallOk
                    ? '🟢 AVAILABLE (Sẵn sàng bay)'
                    : '🟡 MAINTENANCE (Tự động mở Ticket Bảo trì)'
                }
              />
              {completed.ticketCreated && (
                <Row
                  label="Ticket Bảo trì Backend"
                  value="TKT-POSTFLIGHT-XXXX (Đã tạo thành công)"
                />
              )}
            </div>

            <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <a
                className="odm-btn odm-btn-ok"
                href={operatorHref({ screen: 'missions' })}
                style={{
                  minWidth: 220,
                  height: 42,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  borderRadius: 10,
                }}
              >
                Về danh sách nhiệm vụ
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="odm-card" style={{ marginBottom: 0 }}>
      <FlightStepHeader
        title="Postflight Check — Kiểm tra sau chuyến bay"
        missionId={missionLabel}
        active={7}
        right={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {postflightMissions.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--tx3, #64748b)' }}>Chọn nhiệm vụ:</span>
                <select
                  value={effectiveMissionId}
                  onChange={(e) => selectMission(e.target.value)}
                  style={{
                    height: 34,
                    padding: '0 12px',
                    borderRadius: 17,
                    background: 'var(--sf, #fff)',
                    border: '1.5px solid var(--bd, #cbd5e1)',
                    fontSize: 13,
                    fontWeight: 700,
                    color: 'var(--tx, #0f172a)',
                    cursor: 'pointer',
                    outline: 'none',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  }}
                >
                  {postflightMissions.map((m) => (
                    <option key={m.id} value={m.id}>
                      🎯 {m.missionCode || m.id} ({m.droneCode || 'DRONE'}) — {m.status}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                height: 34,
                padding: '0 14px',
                borderRadius: 17,
                background: 'var(--sf3, #f1f5f9)',
                fontWeight: 700,
                fontSize: 13,
                border: '1px solid var(--bd, #cbd5e1)',
              }}
            >
              🚁 {droneCode}
            </span>
          </div>
        }
      />

      <div style={{ padding: '24px 28px', maxWidth: 880, margin: '0 auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {error && (
            <div
              role="alert"
              style={{
                padding: '12px 16px',
                borderRadius: 10,
                background: 'var(--red-bg, #fef2f2)',
                border: '1.5px solid var(--red-dot, #ef4444)',
                color: 'var(--red-fg, #b91c1c)',
                fontSize: 13.5,
                fontWeight: 600,
              }}
            >
              ⚠️ {error}
            </div>
          )}

          {telemetrySnapshot && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                gap: 10,
                padding: '12px 14px',
                borderRadius: 12,
                background: 'rgba(37, 99, 235, 0.06)',
                border: '1px solid rgba(37, 99, 235, 0.18)',
              }}
            >
              <TelemetryMetric label="Pin hạ cánh" value={`${telemetrySnapshot.batteryPercent ?? '--'}%`} />
              <TelemetryMetric label="Độ cao" value={`${telemetrySnapshot.altitudeM ?? '--'} m`} />
              <TelemetryMetric label="Tốc độ" value={`${telemetrySnapshot.speedMps ?? '--'} m/s`} />
              <TelemetryMetric label="Heading" value={`${telemetrySnapshot.headingDeg ?? '--'}°`} />
            </div>
          )}

          {/* Progress Header Card */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              borderRadius: 14,
              background: failItems.length > 0 ? 'rgba(239, 68, 68, 0.06)' : 'var(--sf, #f8fafc)',
              border: `1.5px solid ${failItems.length > 0 ? '#fca5a5' : 'var(--bd, #e2e8f0)'}`,
            }}
          >
            <div>
              <div style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--tx3)', fontWeight: 700 }}>
                Tiến độ đánh giá
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, marginTop: 2, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span>{summary.nOk + failItems.length} / {ALL_KEYS.length} mục đã kiểm tra</span>
                {allAssessed && (
                  <span
                    style={{
                      fontSize: 12,
                      padding: '2px 10px',
                      borderRadius: 12,
                      background: failItems.length > 0 ? '#ef4444' : '#10b981',
                      color: '#fff',
                      fontWeight: 700,
                    }}
                  >
                    {failItems.length > 0 ? `${failItems.length} KHÔNG ĐẠT` : '100% ĐẠT'}
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              className="odm-btn"
              onClick={handlePassAll}
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#fff',
                fontWeight: 700,
                padding: '8px 16px',
                borderRadius: 8,
                border: 'none',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)',
                cursor: 'pointer',
              }}
            >
              ✓ Đánh giá tất cả ĐẠT
            </button>
          </div>

          {/* Inspection Item Categories */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {CATEGORIES.map((cat) => (
              <div
                key={cat.title}
                style={{
                  background: 'var(--sf, #fff)',
                  border: '1.5px solid var(--bd, #e2e8f0)',
                  borderRadius: 14,
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
                }}
              >
                <div
                  style={{
                    padding: '10px 16px',
                    background: 'var(--sf2, #f8fafc)',
                    borderBottom: '1px solid var(--bd, #e2e8f0)',
                    fontWeight: 700,
                    fontSize: 13.5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    color: 'var(--tx, #1e293b)',
                  }}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.title}</span>
                </div>

                <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {cat.items.map((item) => {
                    const status = results[item.key] ?? null
                    const isOk = status === 'ok'
                    const isFail = status === 'fail'

                    return (
                      <div
                        key={item.key}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 16px',
                          borderRadius: 10,
                          background: isFail
                            ? 'rgba(239, 68, 68, 0.08)'
                            : isOk
                              ? 'rgba(16, 185, 129, 0.05)'
                              : 'var(--sf3, #f8fafc)',
                          border: `1.5px solid ${isFail ? '#fca5a5' : isOk ? '#a7f3d0' : 'var(--bd, #e2e8f0)'
                            }`,
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0, paddingRight: 16 }}>
                          <div style={{ fontWeight: 700, fontSize: 14.5, color: 'var(--tx, #0f172a)' }}>
                            {item.label}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--tx3, #64748b)', marginTop: 2 }}>
                            {item.detail}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: 8, flex: 'none' }}>
                          <button
                            type="button"
                            onClick={() => handleSetResult(item.key, 'ok')}
                            style={{
                              padding: '7px 18px',
                              borderRadius: 8,
                              fontWeight: 700,
                              fontSize: 13,
                              border: '1.5px solid',
                              borderColor: isOk ? '#10b981' : '#cbd5e1',
                              background: isOk ? '#10b981' : '#fff',
                              color: isOk ? '#fff' : '#475569',
                              cursor: 'pointer',
                              boxShadow: isOk ? '0 2px 6px rgba(16, 185, 129, 0.3)' : 'none',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            ✓ ĐẠT
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSetResult(item.key, 'fail')}
                            style={{
                              padding: '7px 16px',
                              borderRadius: 8,
                              fontWeight: 700,
                              fontSize: 13,
                              border: '1.5px solid',
                              borderColor: isFail ? '#ef4444' : '#cbd5e1',
                              background: isFail ? '#ef4444' : '#fff',
                              color: isFail ? '#fff' : '#475569',
                              cursor: 'pointer',
                              boxShadow: isFail ? '0 2px 6px rgba(239, 68, 68, 0.3)' : 'none',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            ✕ KHÔNG ĐẠT
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Notes Section */}
          <div
            style={{
              background: 'var(--sf, #fff)',
              border: '1.5px solid var(--bd, #e2e8f0)',
              borderRadius: 14,
              padding: 16,
            }}
          >
            <label style={{ fontWeight: 700, fontSize: 14, display: 'block', marginBottom: 8 }}>
              📝 Ghi chú kiểm tra sau bay (Notes)
            </label>
            <textarea
              className="odm-input"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ghi chú thêm về hiện trạng drone, điều kiện môi trường hoặc phát sinh trong chuyến bay..."
              style={{ width: '100%', resize: 'vertical', borderRadius: 8, padding: 10 }}
            />
          </div>

          {/* Maintenance Ticket Alert Banner */}
          {failItems.length > 0 ? (
            <div
              style={{
                padding: '16px 20px',
                borderRadius: 14,
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.15) 100%)',
                border: '1.5px solid #f59e0b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
              }}
            >
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#92400e' }}>
                  🚨 Phát hiện {failItems.length} mục KHÔNG ĐẠT
                </div>
                <div style={{ fontSize: 13, color: '#78350f', marginTop: 4 }}>
                  Hệ thống Backend sẽ <b>tự động khởi tạo Ticket Bảo trì (Ticket Status: OPEN)</b> cho drone <b>{droneCode}</b> ngay khi bạn gửi báo cáo.
                </div>
              </div>

              <button
                type="button"
                className="odm-btn"
                onClick={() => setShowTicketDialog(true)}
                style={{
                  background: '#f59e0b',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 13,
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: 'none',
                  flex: 'none',
                  cursor: 'pointer',
                }}
              >
                {ticketCreated ? '✓ Đã bổ sung chi tiết' : '✏️ Bổ sung mô tả bảo trì'}
              </button>
            </div>
          ) : (
            <div
              style={{
                padding: '14px 18px',
                borderRadius: 12,
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1.5px solid #10b981',
                fontSize: 13.5,
                color: '#065f46',
                fontWeight: 600,
              }}
            >
              🟢 Tất cả các hạng mục đạt tiêu chuẩn. Thiết bị sẽ được chuyển trạng thái <b>SẴN SÀNG (AVAILABLE)</b> cho chuyến bay tiếp theo.
            </div>
          )}

          {/* Action Footer */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
            <button
              type="button"
              className="odm-btn odm-btn-ok"
              disabled={saving || !allAssessed}
              onClick={handleComplete}
              style={{
                minWidth: 240,
                height: 46,
                fontSize: 15,
                fontWeight: 800,
                borderRadius: 10,
                background: !allAssessed
                  ? '#94a3b8'
                  : failItems.length > 0
                    ? '#f59e0b'
                    : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#fff',
                cursor: !allAssessed || saving ? 'not-allowed' : 'pointer',
                boxShadow: allAssessed ? '0 4px 14px rgba(16, 185, 129, 0.35)' : 'none',
                border: 'none',
              }}
            >
              {saving ? 'Đang gửi báo cáo...' : failItems.length > 0 ? 'Gửi báo cáo & Tạo Ticket Bảo trì' : 'Hoàn tất chuyến bay'}
            </button>
          </div>
        </div>
      </div>

      {showTicketDialog && (
        <MaintenanceTicketDialog
          droneCode={droneCode}
          missionId={missionLabel}
          defaultIssueType="PHYSICAL_DAMAGE"
          defaultDescription={`Mục không đạt kiểm tra sau bay: ${failItems.join(', ')}`}
          submitting={ticketSubmitting}
          onCancel={() => setShowTicketDialog(false)}
          onConfirm={handleCreateTicket}
        />
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5 }}>
      <span style={{ color: 'var(--tx3, #64748b)', fontWeight: 500 }}>{label}:</span>
      <span style={{ fontWeight: 700, color: 'var(--tx, #0f172a)' }}>{value}</span>
    </div>
  )
}

function TelemetryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--tx3, #64748b)', fontWeight: 800 }}>
        {label}
      </div>
      <div style={{ marginTop: 3, fontSize: 17, color: 'var(--tx, #0f172a)', fontWeight: 900 }}>
        {value}
      </div>
    </div>
  )
}
