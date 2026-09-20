// MNG-10: Maintenance ticket kanban board
import { useMemo, useState } from 'react'

import { ApiError } from '../../../shared/api/httpClient'
import { StatusBadge } from '../../../shared/components/odm/StatusBadge'
import { StateView } from '../../../shared/components/odm/StateView'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import {
  ticketSeverityLabel,
  ticketSeverityTone,
  ticketStatusLabel,
  ticketStatusTone,
} from '../../../shared/lib/statusTone'
import type { TicketSeverity, TicketStatus } from '../../../shared/types/domain'
import { maintenanceApi } from '../api/maintenanceApi'
import type { MaintenanceTicket } from '../types/maintenance'
import '../manager.css'

const COLUMNS: TicketStatus[] = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']

const NEXT_STATUS: Partial<Record<TicketStatus, TicketStatus>> = {
  OPEN: 'IN_PROGRESS',
  IN_PROGRESS: 'RESOLVED',
  RESOLVED: 'CLOSED',
}

const NEXT_STATUS_LABEL: Partial<Record<TicketStatus, string>> = {
  OPEN: 'Bắt đầu xử lý',
  IN_PROGRESS: 'Đánh dấu đã xử lý',
  RESOLVED: 'Đóng ticket',
}

function formatAge(openedAt: string): string {
  const ms = Date.now() - new Date(openedAt).getTime()
  const days = Math.floor(ms / (1000 * 60 * 60 * 24))
  if (days > 0) return `${days} ngày trước`
  const hours = Math.floor(ms / (1000 * 60 * 60))
  if (hours > 0) return `${hours} giờ trước`
  return 'Vừa tạo'
}

type TicketCardProps = {
  ticket: MaintenanceTicket
  onTransition: (ticket: MaintenanceTicket, newStatus: TicketStatus) => void
  onSelect: (ticket: MaintenanceTicket) => void
  selected: boolean
}

function TicketCard({
  ticket,
  onTransition,
  onSelect,
  selected,
}: TicketCardProps) {
  const nextStatus = NEXT_STATUS[ticket.status]
  const priorityBorderColor: Record<TicketSeverity, string> = {
    CRITICAL: 'var(--red-fg)',
    HIGH: 'var(--orange-fg)',
    MEDIUM: 'var(--yellow-fg)',
    LOW: 'var(--tx3)',
  }

  return (
    <div
      className="odm-card"
      style={{
        padding: 12,
        cursor: 'pointer',
        borderLeft: `3px solid ${priorityBorderColor[ticket.priority]}`,
        background: selected ? 'var(--bg2)' : undefined,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
      onClick={() => onSelect(ticket)}
    >
      <div style={{ fontSize: 11, color: 'var(--tx3)' }}>{ticket.code}</div>
      <div style={{ fontWeight: 600, fontSize: 13, lineHeight: 1.3 }}>
        {ticket.title}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        <StatusBadge tone={ticketSeverityTone[ticket.priority]}>
          {ticketSeverityLabel[ticket.priority]}
        </StatusBadge>
        <span
          style={{
            fontSize: 11,
            padding: '2px 6px',
            borderRadius: 4,
            background: 'var(--bg2)',
            color: 'var(--tx2)',
          }}
        >
          {ticket.droneCode}
        </span>
        {ticket.issueType && (
          <span
            style={{
              fontSize: 11,
              padding: '2px 6px',
              borderRadius: 4,
              background: 'var(--bg2)',
              color: 'var(--tx2)',
            }}
          >
            {ticket.issueType}
          </span>
        )}
      </div>
      {ticket.assignedTo && (
        <div style={{ fontSize: 11, color: 'var(--tx3)' }}>
          {ticket.assignedTo}
        </div>
      )}
      <div style={{ fontSize: 11, color: 'var(--tx3)' }}>
        {formatAge(ticket.openedAt)}
      </div>
      {nextStatus && (
        <button
          type="button"
          className="odm-btn"
          style={{ fontSize: 12, marginTop: 4 }}
          onClick={(e) => {
            e.stopPropagation()
            onTransition(ticket, nextStatus)
          }}
        >
          {NEXT_STATUS_LABEL[ticket.status]}
        </button>
      )}
    </div>
  )
}

type DetailPanelProps = {
  ticket: MaintenanceTicket
  onClose: () => void
}

function DetailPanel({ ticket, onClose }: DetailPanelProps) {
  return (
    <div
      style={{
        width: 360,
        borderLeft: '1px solid var(--border)',
        padding: 16,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        flexShrink: 0,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontWeight: 600, fontSize: 14 }}>{ticket.code}</span>
        <button
          type="button"
          className="odm-btn"
          onClick={onClose}
          aria-label="Đóng"
        >
          ✕
        </button>
      </div>

      <div style={{ fontWeight: 600, fontSize: 15 }}>{ticket.title}</div>

      <div style={{ display: 'flex', gap: 6 }}>
        <StatusBadge tone={ticketStatusTone[ticket.status]}>
          {ticketStatusLabel[ticket.status]}
        </StatusBadge>
        <StatusBadge tone={ticketSeverityTone[ticket.priority]}>
          {ticketSeverityLabel[ticket.priority]}
        </StatusBadge>
      </div>

      <div
        style={{
          fontSize: 13,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <div>
          <span style={{ color: 'var(--tx3)' }}>Drone: </span>
          <span>
            {ticket.droneCode}
            {ticket.droneName ? ` ${ticket.droneName}` : ''}
          </span>
        </div>
        {ticket.issueType && (
          <div>
            <span style={{ color: 'var(--tx3)' }}>Loại sự cố: </span>
            <span>{ticket.issueType}</span>
          </div>
        )}
        {ticket.description && (
          <div>
            <span style={{ color: 'var(--tx3)' }}>Mô tả: </span>
            <span style={{ whiteSpace: 'pre-wrap' }}>{ticket.description}</span>
          </div>
        )}
        {ticket.reportedBy && (
          <div>
            <span style={{ color: 'var(--tx3)' }}>Báo cáo: </span>
            <span>{ticket.reportedBy}</span>
          </div>
        )}
        {ticket.assignedTo && (
          <div>
            <span style={{ color: 'var(--tx3)' }}>Phụ trách: </span>
            <span>{ticket.assignedTo}</span>
          </div>
        )}
        {ticket.missionId && (
          <div>
            <span style={{ color: 'var(--tx3)' }}>Mission: </span>
            <span>{ticket.missionId}</span>
          </div>
        )}
        {ticket.downtime_hours != null && (
          <div>
            <span style={{ color: 'var(--tx3)' }}>Downtime: </span>
            <span>{ticket.downtime_hours} giờ</span>
          </div>
        )}
        {ticket.resolutionNotes && (
          <div>
            <span style={{ color: 'var(--tx3)' }}>Ghi chú xử lý: </span>
            <span>{ticket.resolutionNotes}</span>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div
        style={{
          borderTop: '1px solid var(--border)',
          paddingTop: 12,
          fontSize: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 4 }}>Timeline</div>
        <div>
          <span style={{ color: 'var(--tx3)' }}>Mở: </span>
          <span>{new Date(ticket.openedAt).toLocaleString('vi-VN')}</span>
        </div>
        {ticket.resolvedAt && (
          <div>
            <span style={{ color: 'var(--tx3)' }}>Giải quyết: </span>
            <span>{new Date(ticket.resolvedAt).toLocaleString('vi-VN')}</span>
          </div>
        )}
        {ticket.closedAt && (
          <div>
            <span style={{ color: 'var(--tx3)' }}>Đóng: </span>
            <span>{new Date(ticket.closedAt).toLocaleString('vi-VN')}</span>
          </div>
        )}
      </div>
    </div>
  )
}

const SEVERITIES: TicketSeverity[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

type CreateModalProps = {
  onClose: () => void
  onCreate: (ticket: MaintenanceTicket) => void
}

function CreateModal({ onClose, onCreate }: CreateModalProps) {
  const [droneId, setDroneId] = useState('')
  const [title, setTitle] = useState('')
  const [issueType, setIssueType] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TicketSeverity>('MEDIUM')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate() {
    setSaving(true)
    setError(null)
    try {
      const ticket = await maintenanceApi.createTicket({
        droneId,
        title,
        issueType: issueType || undefined,
        description: description || undefined,
        priority,
      })
      onCreate(ticket)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi không xác định')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
      onClick={onClose}
    >
      <div
        className="odm-card"
        style={{ padding: 24, width: 440 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Tạo ticket bảo trì</h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label
              htmlFor="ct-drone"
              style={{
                fontSize: 12,
                color: 'var(--tx2)',
                display: 'block',
                marginBottom: 4,
              }}
            >
              Drone *
            </label>
            <input
              id="ct-drone"
              className="odm-input"
              value={droneId}
              onChange={(e) => setDroneId(e.target.value)}
              placeholder="VD: drn-01"
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <label
              htmlFor="ct-title"
              style={{
                fontSize: 12,
                color: 'var(--tx2)',
                display: 'block',
                marginBottom: 4,
              }}
            >
              Tiêu đề *
            </label>
            <input
              id="ct-title"
              className="odm-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Mô tả ngắn sự cố..."
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <label
              htmlFor="ct-priority"
              style={{
                fontSize: 12,
                color: 'var(--tx2)',
                display: 'block',
                marginBottom: 4,
              }}
            >
              Mức độ ưu tiên
            </label>
            <select
              id="ct-priority"
              className="odm-input"
              value={priority}
              onChange={(e) => setPriority(e.target.value as TicketSeverity)}
              style={{ width: '100%' }}
            >
              {SEVERITIES.map((s) => (
                <option key={s} value={s}>
                  {ticketSeverityLabel[s]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="ct-issue"
              style={{
                fontSize: 12,
                color: 'var(--tx2)',
                display: 'block',
                marginBottom: 4,
              }}
            >
              Loại sự cố
            </label>
            <input
              id="ct-issue"
              className="odm-input"
              value={issueType}
              onChange={(e) => setIssueType(e.target.value)}
              placeholder="VD: MOTOR_VIBRATION"
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <label
              htmlFor="ct-desc"
              style={{
                fontSize: 12,
                color: 'var(--tx2)',
                display: 'block',
                marginBottom: 4,
              }}
            >
              Mô tả
            </label>
            <textarea
              id="ct-desc"
              className="odm-input"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Chi tiết sự cố..."
              style={{ width: '100%', resize: 'vertical' }}
            />
          </div>

          {error && (
            <div style={{ color: 'var(--red-fg)', fontSize: 13 }}>{error}</div>
          )}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="odm-btn"
              onClick={onClose}
              disabled={saving}
            >
              Huỷ
            </button>
            <button
              type="button"
              className="odm-btn odm-btn-p"
              onClick={handleCreate}
              disabled={saving}
            >
              {saving ? 'Đang tạo...' : 'Tạo ticket'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function MaintenancePage() {
  const [tickets, setTickets] = useState<MaintenanceTicket[] | null>(null)
  const [selectedTicket, setSelectedTicket] =
    useState<MaintenanceTicket | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [transitionError, setTransitionError] = useState<string | null>(null)

  const query = useApiQuery(
    (signal) => maintenanceApi.listTickets({ signal }),
    [],
  )

  const allTickets = tickets ?? query.data?.items ?? []

  const byColumn = useMemo(() => {
    const map: Record<TicketStatus, MaintenanceTicket[]> = {
      OPEN: [],
      IN_PROGRESS: [],
      RESOLVED: [],
      CLOSED: [],
    }
    for (const t of allTickets) {
      map[t.status]?.push(t)
    }
    return map
  }, [allTickets])

  const openCount = byColumn.OPEN.length + byColumn.IN_PROGRESS.length
  const urgentCount = allTickets.filter(
    (t) =>
      (t.status === 'OPEN' || t.status === 'IN_PROGRESS') &&
      (t.priority === 'CRITICAL' || t.priority === 'HIGH'),
  ).length

  async function handleTransition(
    ticket: MaintenanceTicket,
    newStatus: TicketStatus,
  ) {
    setTransitionError(null)
    try {
      const updated = await maintenanceApi.patchTicketStatus(
        ticket.id,
        newStatus,
      )
      const base = tickets ?? query.data?.items ?? []
      setTickets(base.map((t) => (t.id === updated.id ? updated : t)))
      if (selectedTicket?.id === updated.id) {
        setSelectedTicket(updated)
      }
    } catch (e) {
      setTransitionError(e instanceof Error ? e.message : 'Lỗi không xác định')
    }
  }

  function handleCreated(ticket: MaintenanceTicket) {
    const base = tickets ?? query.data?.items ?? []
    setTickets([ticket, ...base])
    setShowCreate(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div className="odm-mgr-dash-head">
        <div>
          <h1 className="odm-mgr-dash-title">Bảo trì</h1>
          {!query.loading && !query.error && (
            <div className="odm-mgr-dash-date" style={{ fontSize: 13 }}>
              {openCount} ticket đang mở · {urgentCount} ticket CRITICAL / HIGH
              cần ưu tiên
            </div>
          )}
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <button
            type="button"
            className="odm-btn odm-btn-p"
            onClick={() => setShowCreate(true)}
          >
            + Tạo ticket
          </button>
        </div>
      </div>

      {transitionError && (
        <div
          style={{
            padding: '8px 16px',
            background: 'var(--red-bg)',
            color: 'var(--red-fg)',
            fontSize: 13,
          }}
        >
          {transitionError}
        </div>
      )}

      {/* Content */}
      {query.loading && (
        <div style={{ padding: 40, textAlign: 'center' }} aria-busy="true">
          <div className="odm-sk" style={{ height: 300, borderRadius: 8 }} />
        </div>
      )}

      {!query.loading && !!query.error && (
        <div style={{ padding: 24 }}>
          <StateView
            state="error"
            title="Không tải được danh sách ticket"
            error={query.error}
            onRetry={query.reload}
          />
          {query.error instanceof ApiError && (
            <code
              className="odm-mono"
              style={{
                display: 'block',
                fontSize: 11,
                color: 'var(--tx3)',
                marginTop: 8,
              }}
            >
              GET /api/maintenance-tickets · {query.error.status ?? '—'}
            </code>
          )}
        </div>
      )}

      {!query.loading && !query.error && (
        <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
          {/* Kanban board */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              gap: 12,
              overflowX: 'auto',
              padding: '12px 0',
            }}
          >
            {COLUMNS.map((col) => (
              <div
                key={col}
                style={{
                  minWidth: 240,
                  flex: '1 1 240px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <div
                  style={{
                    padding: '6px 8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <StatusBadge tone={ticketStatusTone[col]}>
                    {ticketStatusLabel[col]}
                  </StatusBadge>
                  <span
                    style={{
                      fontSize: 12,
                      color: 'var(--tx3)',
                      background: 'var(--bg2)',
                      borderRadius: 10,
                      padding: '1px 7px',
                    }}
                  >
                    {byColumn[col].length}
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    overflowY: 'auto',
                  }}
                >
                  {byColumn[col].length === 0 && (
                    <div
                      style={{
                        fontSize: 12,
                        color: 'var(--tx3)',
                        textAlign: 'center',
                        padding: 16,
                      }}
                    >
                      Không có ticket
                    </div>
                  )}
                  {byColumn[col].map((ticket) => (
                    <TicketCard
                      key={ticket.id}
                      ticket={ticket}
                      selected={selectedTicket?.id === ticket.id}
                      onTransition={handleTransition}
                      onSelect={setSelectedTicket}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Detail panel */}
          {selectedTicket && (
            <DetailPanel
              key={selectedTicket.id}
              ticket={selectedTicket}
              onClose={() => setSelectedTicket(null)}
            />
          )}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onCreate={handleCreated}
        />
      )}
    </div>
  )
}
