// MNG-11 · Media và giao kết quả
import { useState } from 'react'

import { ApiError } from '../../../shared/api/httpClient'
import { StatusBadge } from '../../../shared/components/odm/StatusBadge'
import { StateView } from '../../../shared/components/odm/StateView'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import {
  mediaStatusLabel,
  mediaStatusTone,
  missionStatusLabel,
  missionStatusTone,
} from '../../../shared/lib/statusTone'
import { mediaApi } from '../api/mediaApi'
import type {
  BadMediaItem,
  ManualUploadTask,
  WaitingDeliveryMission,
} from '../types/media'
import '../manager.css'

// ── helpers ────────────────────────────────────────────────────────────────

function formatAge(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(ms / 60000)
  if (mins < 60) return `${mins} phút trước`
  const hours = Math.floor(ms / 3600000)
  if (hours < 24) return `${hours} giờ trước`
  return `${Math.floor(ms / 86400000)} ngày trước`
}

function formatVnDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

const OVERLAY_STYLE: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(6,9,14,.55)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 50,
}

const DLG_STYLE: React.CSSProperties = {
  background: 'var(--sf)',
  border: '1px solid var(--bd)',
  borderRadius: 12,
  boxShadow: '0 24px 64px rgba(0,0,0,.35)',
  overflow: 'hidden',
}

const DLG_HEAD_STYLE: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 12,
  padding: '16px 18px 10px',
}

const DLG_BODY_STYLE: React.CSSProperties = {
  padding: '4px 18px 16px',
}

const DLG_FOOT_STYLE: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 8,
  padding: '12px 18px',
  borderTop: '1px solid var(--bd)',
  background: 'var(--sf2)',
}

// ── sub-components ─────────────────────────────────────────────────────────

type ReassignModalProps = {
  task: ManualUploadTask
  operators: { id: string; name: string }[]
  onClose: () => void
  onSuccess: () => void
}

function ReassignModal({
  task,
  operators,
  onClose,
  onSuccess,
}: ReassignModalProps) {
  const [selectedId, setSelectedId] = useState(task.assignedOperatorId)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    setSubmitting(true)
    setError(null)
    try {
      await mediaApi.reassignTask(task.id, selectedId)
      onSuccess()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Có lỗi xảy ra')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      style={OVERLAY_STYLE}
      role="dialog"
      aria-modal="true"
      aria-label="Giao lại cho phi công"
    >
      <div style={{ ...DLG_STYLE, width: 460, maxWidth: 'calc(100% - 48px)' }}>
        <div style={DLG_HEAD_STYLE}>
          <div>
            <div
              style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-.01em' }}
            >
              Giao lại cho phi công
            </div>
            <div
              style={{
                color: 'var(--tx3)',
                marginTop: 3,
                fontSize: 12.5,
                lineHeight: 1.45,
              }}
            >
              Cập nhật manual_upload_task.assigned_operator_id
            </div>
          </div>
          <button
            type="button"
            className="odm-btn odm-btn-gh odm-btn-ic1 odm-btn-sm"
            onClick={onClose}
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>
        <div style={DLG_BODY_STYLE}>
          <label style={{ display: 'block' }}>
            <span
              style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--tx2)',
                marginBottom: 4,
              }}
            >
              Phi công
            </span>
            <select
              className="odm-inp"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              {operators.map((op) => (
                <option key={op.id} value={op.id}>
                  {op.name}
                  {op.id === task.assignedOperatorId ? ' (đang giao)' : ''}
                </option>
              ))}
            </select>
          </label>
          {error && (
            <div
              style={{ fontSize: 11.5, color: 'var(--red-fg)', marginTop: 4 }}
            >
              {error}
            </div>
          )}
        </div>
        <div style={DLG_FOOT_STYLE}>
          <button type="button" className="odm-btn" onClick={onClose}>
            Huỷ
          </button>
          <button
            type="button"
            className="odm-btn odm-btn-p"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? 'Đang giao…' : 'Giao lại'}
          </button>
        </div>
      </div>
    </div>
  )
}

type ReuploadModalProps = {
  media: BadMediaItem
  onClose: () => void
  onSuccess: () => void
}

function ReuploadModal({
  media: _media,
  onClose,
  onSuccess,
}: ReuploadModalProps) {
  const [reason, setReason] = useState(
    'Tệp bị lỗi khi xác thực, vui lòng upload lại từ thiết bị.',
  )
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    setSubmitting(true)
    setError(null)
    try {
      await mediaApi.requestReupload(_media.id, reason)
      onSuccess()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Có lỗi xảy ra')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      style={OVERLAY_STYLE}
      role="dialog"
      aria-modal="true"
      aria-label="Yêu cầu upload lại"
    >
      <div style={{ ...DLG_STYLE, width: 460, maxWidth: 'calc(100% - 48px)' }}>
        <div style={DLG_HEAD_STYLE}>
          <div>
            <div
              style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-.01em' }}
            >
              Yêu cầu upload lại?
            </div>
            <div
              style={{
                color: 'var(--tx3)',
                marginTop: 3,
                fontSize: 12.5,
                lineHeight: 1.45,
              }}
            >
              Media về trạng thái PENDING_UPLOAD và phi công nhận thông báo.
            </div>
          </div>
          <button
            type="button"
            className="odm-btn odm-btn-gh odm-btn-ic1 odm-btn-sm"
            onClick={onClose}
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>
        <div style={DLG_BODY_STYLE}>
          <label style={{ display: 'block' }}>
            <span
              style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--tx2)',
                marginBottom: 4,
              }}
            >
              Ghi chú cho phi công
            </span>
            <textarea
              className="odm-inp"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </label>
          {error && (
            <div
              style={{ fontSize: 11.5, color: 'var(--red-fg)', marginTop: 4 }}
            >
              {error}
            </div>
          )}
        </div>
        <div style={DLG_FOOT_STYLE}>
          <button type="button" className="odm-btn" onClick={onClose}>
            Huỷ
          </button>
          <button
            type="button"
            className="odm-btn odm-btn-p"
            onClick={handleSubmit}
            disabled={submitting || !reason.trim()}
          >
            {submitting ? 'Đang gửi…' : 'Gửi yêu cầu'}
          </button>
        </div>
      </div>
    </div>
  )
}

type DeliverModalProps = {
  mission: WaitingDeliveryMission
  onClose: () => void
  onSuccess: () => void
}

function DeliverModal({ mission, onClose, onSuccess }: DeliverModalProps) {
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    setSubmitting(true)
    setError(null)
    try {
      await mediaApi.deliverOrder(mission.orderId, note || undefined)
      onSuccess()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Có lỗi xảy ra')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      style={OVERLAY_STYLE}
      role="dialog"
      aria-modal="true"
      aria-label="Giao kết quả cho khách"
    >
      <div style={{ ...DLG_STYLE, width: 640, maxWidth: 'calc(100% - 48px)' }}>
        <div style={DLG_HEAD_STYLE}>
          <div>
            <div
              style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-.01em' }}
            >
              Giao kết quả cho khách
            </div>
            <div
              style={{
                color: 'var(--tx3)',
                marginTop: 3,
                fontSize: 12.5,
                lineHeight: 1.45,
              }}
            >
              {mission.missionCode} · {mission.customerName} ·{' '}
              {mission.companyName}
            </div>
          </div>
          <button
            type="button"
            className="odm-btn odm-btn-gh odm-btn-ic1 odm-btn-sm"
            onClick={onClose}
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>
        <div
          style={{
            ...DLG_BODY_STYLE,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div style={{ fontSize: 11.5, color: 'var(--tx3)' }}>
            Xem trước {mission.totalFiles} tệp ({mission.photoCount} ảnh,{' '}
            {mission.videoCount} video) · tất cả VALIDATED
          </div>
          <label style={{ display: 'block' }}>
            <span
              style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--tx2)',
                marginBottom: 4,
              }}
            >
              note (hiển thị cho khách)
            </span>
            <textarea
              className="odm-inp"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ghi chú tuỳ chọn cho khách…"
            />
          </label>
          <div
            style={{
              padding: '10px 12px',
              borderRadius: 8,
              background: 'var(--sf2)',
              border: '1px solid var(--bd)',
              fontSize: 12.5,
              lineHeight: 1.6,
            }}
          >
            Khi xác nhận hệ thống sẽ: đặt{' '}
            <span className="odm-mono">available_at</span> cho{' '}
            {mission.totalFiles} tệp → tạo{' '}
            <span className="odm-mono">media_delivery</span> (media_count ={' '}
            {mission.totalFiles}) → gửi{' '}
            <span className="odm-mono">notification</span> tới khách.
          </div>
          {error && (
            <div style={{ fontSize: 11.5, color: 'var(--red-fg)' }}>
              {error}
            </div>
          )}
        </div>
        <div style={DLG_FOOT_STYLE}>
          <button type="button" className="odm-btn" onClick={onClose}>
            Huỷ
          </button>
          <button
            type="button"
            className="odm-btn odm-btn-ok"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? 'Đang giao…' : 'Giao kết quả'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── main page ──────────────────────────────────────────────────────────────

type ActiveModal =
  | { kind: 'reassign'; task: ManualUploadTask }
  | { kind: 'reupload'; media: BadMediaItem }
  | { kind: 'deliver'; mission: WaitingDeliveryMission }
  | null

export function MediaPage() {
  const [activeTab, setActiveTab] = useState<'man' | 'bad' | 'wait'>('man')
  const [modal, setModal] = useState<ActiveModal>(null)

  const query = useApiQuery((signal) => mediaApi.listNeedsAction(signal), [])
  const data = query.data

  const manualCount = data?.manualUploadTasks.length ?? 0
  const badCount = data?.badMediaItems.length ?? 0
  const waitCount = data?.waitingDeliveryMissions.length ?? 0

  function reload() {
    query.reload()
  }

  if (query.loading && !data) {
    return (
      <div>
        <h1
          style={{
            margin: '0 0 16px',
            fontSize: 20,
            fontWeight: 600,
            letterSpacing: '-.01em',
          }}
        >
          Media và giao kết quả
        </h1>
        <div className="odm-card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="odm-sk"
                style={{ width: '100%', height: 44 }}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (query.error) {
    return (
      <div>
        <h1
          style={{
            margin: '0 0 16px',
            fontSize: 20,
            fontWeight: 600,
            letterSpacing: '-.01em',
          }}
        >
          Media và giao kết quả
        </h1>
        <StateView
          state="error"
          title="Không tải được danh sách media"
          error={query.error}
          onRetry={reload}
        />
      </div>
    )
  }

  const totalItems = manualCount + badCount + waitCount

  if (!data || totalItems === 0) {
    return (
      <div>
        <h1
          style={{
            margin: '0 0 16px',
            fontSize: 20,
            fontWeight: 600,
            letterSpacing: '-.01em',
          }}
        >
          Media và giao kết quả
        </h1>
        <StateView
          state="empty"
          title="Không có việc tồn đọng"
          description="Mọi media đã được upload, xác thực và giao cho khách."
        />
      </div>
    )
  }

  return (
    <div style={{ position: 'relative' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 16,
          marginBottom: 16,
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 600,
              letterSpacing: '-.01em',
              lineHeight: 1.25,
            }}
          >
            Media và giao kết quả
          </h1>
          <div style={{ color: 'var(--tx3)', fontSize: 12.5, marginTop: 3 }}>
            {manualCount} tệp cần upload thủ công · {badCount} tệp lỗi xác thực
            · {waitCount} mission chờ giao
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div
        role="tablist"
        style={{
          display: 'flex',
          gap: 2,
          borderBottom: '1px solid var(--bd)',
          marginBottom: 14,
        }}
      >
        {(
          [
            { id: 'man', label: 'Manual upload', count: manualCount },
            { id: 'bad', label: 'Media lỗi validate', count: badCount },
            { id: 'wait', label: 'Chờ giao kết quả', count: waitCount },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              height: 38,
              padding: '0 14px',
              border: 0,
              borderBottom:
                activeTab === tab.id
                  ? '2px solid var(--ink)'
                  : '2px solid transparent',
              marginBottom: -1,
              background: 'transparent',
              font: "600 13px 'IBM Plex Sans',system-ui,sans-serif",
              color: activeTab === tab.id ? 'var(--tx)' : 'var(--tx3)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {tab.label}
            <span
              style={{
                fontSize: 11,
                padding: '1px 6px',
                borderRadius: 9,
                background: 'var(--sf3)',
                color: 'var(--tx2)',
              }}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Tab: Manual upload */}
      {activeTab === 'man' && (
        <div>
          <div className="odm-card" style={{ overflow: 'hidden' }}>
            <table className="odm-table">
              <thead>
                <tr>
                  <th>Tệp</th>
                  <th style={{ width: 145 }}>Mission</th>
                  <th>Lý do (manual_upload_task.reason)</th>
                  <th style={{ width: 160 }}>Phi công được giao</th>
                  <th style={{ width: 120 }}>Trạng thái</th>
                  <th style={{ width: 100 }}>Tạo lúc</th>
                  <th style={{ width: 190, textAlign: 'right' }} />
                </tr>
              </thead>
              <tbody>
                {data.manualUploadTasks.map((task) => (
                  <tr key={task.id}>
                    <td>
                      <div style={{ fontWeight: 600 }} className="odm-mono">
                        {task.fileName}
                      </div>
                      <div style={{ color: 'var(--tx3)', fontSize: 11.5 }}>
                        {task.mediaType} · {task.fileSizeLabel} ·{' '}
                        <StatusBadge tone={mediaStatusTone[task.mediaStatus]}>
                          {mediaStatusLabel[task.mediaStatus]}
                        </StatusBadge>
                      </div>
                    </td>
                    <td>
                      <span className="odm-mono">{task.missionCode}</span>
                    </td>
                    <td>
                      <span style={{ lineHeight: 1.4 }}>{task.reason}</span>
                    </td>
                    <td>{task.assignedOperatorName}</td>
                    <td>
                      <StatusBadge tone="yellow">
                        {task.taskStatus === 'OPEN' ? 'Mở' : task.taskStatus}
                      </StatusBadge>
                    </td>
                    <td>
                      <span className="odm-mono" style={{ fontSize: 11.5 }}>
                        {formatAge(task.createdAt)}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="odm-btn odm-btn-sm"
                        onClick={() => setModal({ kind: 'reassign', task })}
                      >
                        Giao lại
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--tx3)', marginTop: 4 }}>
            Phi công bị lỗi upload 3 lần liên tiếp ở OPR-08 sẽ tự sinh
            manual_upload_task.
          </div>
        </div>
      )}

      {/* Tab: Media lỗi validate */}
      {activeTab === 'bad' && (
        <div className="odm-card" style={{ overflow: 'hidden' }}>
          <table className="odm-table">
            <thead>
              <tr>
                <th>Tệp</th>
                <th style={{ width: 145 }}>Mission</th>
                <th style={{ width: 150 }}>media_status</th>
                <th>validation_error</th>
                <th style={{ width: 120 }}>Phi công</th>
                <th style={{ width: 150, textAlign: 'right' }} />
              </tr>
            </thead>
            <tbody>
              {data.badMediaItems.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="odm-mono" style={{ fontWeight: 600 }}>
                      {item.fileName}
                    </div>
                    <div style={{ color: 'var(--tx3)', fontSize: 11.5 }}>
                      {item.mediaType} · {item.fileSizeLabel}
                    </div>
                  </td>
                  <td>
                    <span className="odm-mono">{item.missionCode}</span>
                  </td>
                  <td>
                    <StatusBadge tone={mediaStatusTone[item.mediaStatus]}>
                      {mediaStatusLabel[item.mediaStatus]}
                    </StatusBadge>
                  </td>
                  <td>
                    <span style={{ color: 'var(--red-fg)', lineHeight: 1.4 }}>
                      {item.validationError}
                    </span>
                  </td>
                  <td>{item.operatorName}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      className="odm-btn odm-btn-sm"
                      onClick={() =>
                        setModal({ kind: 'reupload', media: item })
                      }
                    >
                      Yêu cầu upload lại
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Chờ giao kết quả */}
      {activeTab === 'wait' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {data.waitingDeliveryMissions.map((mission) => (
            <div key={mission.missionId} className="odm-card">
              <div
                className="odm-card-body"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0,1fr) auto',
                  gap: 18,
                  alignItems: 'center',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{ display: 'flex', gap: 8, alignItems: 'center' }}
                  >
                    <span className="odm-mono" style={{ fontWeight: 700 }}>
                      {mission.missionCode}
                    </span>
                    <StatusBadge
                      tone={missionStatusTone[mission.missionStatus]}
                    >
                      {missionStatusLabel[mission.missionStatus]}
                    </StatusBadge>
                  </div>
                  <div style={{ fontWeight: 600, margin: '3px 0' }}>
                    {mission.missionTitle}
                  </div>
                  <div style={{ color: 'var(--tx3)', fontSize: 12.5 }}>
                    {mission.orderCode} · {mission.customerName} ·{' '}
                    {mission.companyName}
                  </div>
                  <div
                    style={{
                      marginTop: 6,
                      display: 'flex',
                      gap: 6,
                      flexWrap: 'wrap',
                      alignItems: 'center',
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        height: 22,
                        padding: '0 8px',
                        borderRadius: 5,
                        background: 'var(--sf3)',
                        color: 'var(--tx2)',
                        fontSize: 11.5,
                        fontWeight: 500,
                        border: '1px solid var(--bd)',
                      }}
                    >
                      {mission.serviceType}
                    </span>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        height: 22,
                        padding: '0 8px',
                        borderRadius: 5,
                        background: 'var(--sf3)',
                        color: 'var(--tx2)',
                        fontSize: 11.5,
                        fontWeight: 500,
                        border: '1px solid var(--bd)',
                      }}
                    >
                      {mission.totalFiles} tệp · {mission.photoCount} ảnh ·{' '}
                      {mission.videoCount} video
                    </span>
                    {mission.allValidated && (
                      <StatusBadge tone="green">Đã xác thực</StatusBadge>
                    )}
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        height: 22,
                        padding: '0 8px',
                        borderRadius: 5,
                        background: 'var(--sf3)',
                        color: 'var(--tx2)',
                        fontSize: 11.5,
                        fontWeight: 500,
                        border: '1px solid var(--bd)',
                      }}
                    >
                      validated_at {formatVnDate(mission.validatedAt)}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="odm-btn odm-btn-p"
                  onClick={() => setModal({ kind: 'deliver', mission })}
                >
                  Giao kết quả cho khách
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {modal?.kind === 'reassign' && (
        <ReassignModal
          task={modal.task}
          operators={[
            { id: 'op-ngo-thi-lan-phuong', name: 'Ngô Thị Lan Phương' },
            { id: 'op-bui-anh-tuan', name: 'Bùi Anh Tuấn' },
            { id: 'op-hoang-duc-thang', name: 'Hoàng Đức Thắng' },
            { id: 'op-vu-hai-dang', name: 'Vũ Hải Đăng' },
            { id: 'op-do-minh-quan', name: 'Đỗ Minh Quân' },
            { id: 'op-ly-thanh-son', name: 'Lý Thanh Sơn' },
          ]}
          onClose={() => setModal(null)}
          onSuccess={() => {
            setModal(null)
            reload()
          }}
        />
      )}
      {modal?.kind === 'reupload' && (
        <ReuploadModal
          media={modal.media}
          onClose={() => setModal(null)}
          onSuccess={() => {
            setModal(null)
            reload()
          }}
        />
      )}
      {modal?.kind === 'deliver' && (
        <DeliverModal
          mission={modal.mission}
          onClose={() => setModal(null)}
          onSuccess={() => {
            setModal(null)
            reload()
          }}
        />
      )}
    </div>
  )
}
