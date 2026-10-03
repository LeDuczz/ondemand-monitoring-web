// MNG-10: Maintenance ticket kanban board with Manager Search, Filter & System Operator Assignment Workflow
import { useMemo, useState } from 'react'
import { formatTicketDescription, formatTicketTitle } from '../lib/ticketText'

import { ApiError } from '../../../shared/api/httpClient'
import { StatusBadge } from '../../../shared/components/odm/StatusBadge'
import { StateView } from '../../../shared/components/odm/StateView'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { useI18n, type Language } from '../../../shared/i18n'
import {
  getTicketSeverityLabel,
  getTicketStatusLabel,
  ticketSeverityTone,
  ticketStatusTone,
} from '../../../shared/lib/statusTone'
import type { TicketSeverity, TicketStatus } from '../../../shared/types/domain'
import { maintenanceApi } from '../api/maintenanceApi'
import type { MaintenanceTicket } from '../types/maintenance'
import { maintenancePageMessages } from './MaintenancePage.messages'
import '../manager.css'

const COLUMNS: TicketStatus[] = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']

function formatAge(
  openedAt: string,
  t: (typeof maintenancePageMessages)['vi']['age'],
): string {
  const ms = Date.now() - new Date(openedAt).getTime()
  const days = Math.floor(ms / (1000 * 60 * 60 * 24))
  if (days > 0) return t.daysAgo(days)
  const hours = Math.floor(ms / (1000 * 60 * 60))
  if (hours > 0) return t.hoursAgo(hours)
  return t.justNow
}

type TicketCardProps = {
  ticket: MaintenanceTicket
  onSelect: (ticket: MaintenanceTicket) => void
  onAssignClick: (ticket: MaintenanceTicket) => void
  selected: boolean
}

function TicketCard({
  ticket,
  onSelect,
  onAssignClick,
  selected,
}: TicketCardProps) {
  const { t, lang } = useI18n(maintenancePageMessages)
  const priorityBorderColor: Record<TicketSeverity, string> = {
    CRITICAL: '#ef4444',
    HIGH: '#f97316',
    MEDIUM: '#eab308',
    LOW: '#94a3b8',
  }

  return (
    <div
      className="odm-card"
      style={{
        padding: 16,
        borderRadius: 12,
        cursor: 'pointer',
        borderLeft: `4px solid ${priorityBorderColor[ticket.priority]}`,
        background: selected ? '#f8fafc' : '#ffffff',
        boxShadow: selected
          ? '0 0 0 2px #2563eb'
          : '0 1px 3px rgba(0,0,0,0.06)',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        transition: 'all 0.15s ease',
      }}
      onClick={() => onSelect(ticket)}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span
          className="odm-mono"
          style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}
        >
          {ticket.code}
        </span>
        <span style={{ fontSize: 11.5, color: '#94a3b8' }}>
          {formatAge(ticket.openedAt, t.age)}
        </span>
      </div>

      <div
        style={{
          fontWeight: 700,
          fontSize: 14,
          lineHeight: 1.35,
          color: '#0f172a',
          overflowWrap: 'anywhere',
        }}
      >
        {formatTicketTitle(ticket.title)}
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6,
          alignItems: 'center',
        }}
      >
        <StatusBadge tone={ticketSeverityTone[ticket.priority]}>
          {getTicketSeverityLabel(ticket.priority, lang)}
        </StatusBadge>
        <span
          style={{
            fontSize: 12,
            padding: '2px 8px',
            borderRadius: 6,
            background: '#f1f5f9',
            color: '#475569',
            fontWeight: 600,
          }}
        >
          {ticket.droneCode}
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 2,
          fontSize: 12,
        }}
      >
        {ticket.assignedTo ? (
          <div
            style={{
              color: '#059669',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#10b981',
                display: 'inline-block',
              }}
            />
            <span>
              {t.card.operatorLabel}
              <b>{ticket.assignedTo}</b>
            </span>
          </div>
        ) : (
          <div
            style={{
              color: '#d97706',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#f59e0b',
                display: 'inline-block',
              }}
            />
            <span>{t.card.unassigned}</span>
          </div>
        )}
      </div>

      {(ticket.status === 'OPEN' || ticket.status === 'IN_PROGRESS') && (
        <button
          type="button"
          className="odm-btn odm-btn-p"
          style={{
            fontSize: 12.5,
            marginTop: 4,
            fontWeight: 600,
            padding: '7px 12px',
            borderRadius: 8,
          }}
          onClick={(e) => {
            e.stopPropagation()
            onAssignClick(ticket)
          }}
        >
          {ticket.assignedTo ? t.card.changeOperator : t.card.assignOperator}
        </button>
      )}

      {ticket.status === 'RESOLVED' && (
        <div
          style={{
            fontSize: 12,
            color: '#059669',
            fontWeight: 600,
            background: '#f0fdf4',
            padding: '5px 10px',
            borderRadius: 6,
            textAlign: 'center',
            marginTop: 2,
          }}
        >
          {t.card.resolved}
        </div>
      )}
    </div>
  )
}

type DetailPanelProps = {
  ticket: MaintenanceTicket
  onClose: () => void
  onAssignClick: (ticket: MaintenanceTicket) => void
}

function DetailPanel({ ticket, onClose, onAssignClick }: DetailPanelProps) {
  const { t, lang, locale } = useI18n(maintenancePageMessages)
  return (
    <div
      style={{
        width: 380,
        borderLeft: '1px solid #e2e8f0',
        padding: 20,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        flexShrink: 0,
        background: '#ffffff',
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
          style={{ fontWeight: 700, fontSize: 14, color: '#475569' }}
        >
          {ticket.code}
        </span>
        <button
          type="button"
          className="odm-btn"
          onClick={onClose}
          aria-label={t.detail.close}
          style={{ padding: '2px 8px', borderRadius: '50%' }}
        >
          ✕
        </button>
      </div>

      <div style={{ fontWeight: 800, fontSize: 16, color: '#0f172a' }}>
        {formatTicketTitle(ticket.title)}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <StatusBadge tone={ticketStatusTone[ticket.status]}>
          {getTicketStatusLabel(ticket.status, lang)}
        </StatusBadge>
        <StatusBadge tone={ticketSeverityTone[ticket.priority]}>
          {getTicketSeverityLabel(ticket.priority, lang)}
        </StatusBadge>
      </div>

      <div
        style={{
          fontSize: 13.5,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div>
          <span style={{ color: '#64748b' }}>{t.detail.device}</span>
          <span>
            <b style={{ color: '#0f172a' }}>{ticket.droneCode}</b>
            {ticket.droneName ? ` (${ticket.droneName})` : ''}
          </span>
        </div>
        {ticket.issueType && (
          <div>
            <span style={{ color: '#64748b' }}>{t.detail.issueType}</span>
            <span style={{ fontWeight: 600 }}>{ticket.issueType}</span>
          </div>
        )}
        {ticket.description && (
          <div>
            <span
              style={{ color: '#64748b', display: 'block', marginBottom: 4 }}
            >
              {t.detail.description}
            </span>
            <div
              style={{
                background: '#f8fafc',
                padding: 12,
                borderRadius: 8,
                whiteSpace: 'pre-wrap',
                border: '1px solid #e2e8f0',
                color: '#334155',
                lineHeight: 1.5,
              }}
            >
              {formatTicketDescription(ticket.description)}
            </div>
          </div>
        )}
        {ticket.reportedBy && (
          <div>
            <span style={{ color: '#64748b' }}>{t.detail.reportedBy}</span>
            <span>{ticket.reportedBy}</span>
          </div>
        )}
        <div>
          <span style={{ color: '#64748b' }}>{t.detail.assignedOperator}</span>
          <span>
            {ticket.assignedTo ? (
              <b style={{ color: '#059669' }}>{ticket.assignedTo}</b>
            ) : (
              <b style={{ color: '#d97706' }}>{t.detail.unassigned}</b>
            )}
          </span>
        </div>
        {ticket.resolutionNotes && (
          <div
            style={{
              background: '#f0fdf4',
              padding: 14,
              borderRadius: 10,
              border: '1px solid #bbf7d0',
              marginTop: 4,
            }}
          >
            <span
              style={{
                color: '#166534',
                fontWeight: 700,
                display: 'block',
                marginBottom: 4,
              }}
            >
              {t.detail.resolutionReport}
            </span>
            <span
              style={{ color: '#15803d', whiteSpace: 'pre-wrap', fontSize: 13 }}
            >
              {ticket.resolutionNotes}
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          marginTop: 8,
        }}
      >
        {(ticket.status === 'OPEN' || ticket.status === 'IN_PROGRESS') && (
          <button
            type="button"
            className="odm-btn odm-btn-p"
            onClick={() => onAssignClick(ticket)}
            style={{
              width: '100%',
              height: 42,
              fontWeight: 600,
              borderRadius: 10,
            }}
          >
            {ticket.assignedTo
              ? t.detail.changeOperator
              : t.detail.assignOperator}
          </button>
        )}

        {ticket.status === 'RESOLVED' && (
          <div
            style={{
              background: '#f0fdf4',
              padding: 12,
              borderRadius: 10,
              border: '1px solid #bbf7d0',
              textAlign: 'center',
              color: '#15803d',
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            {t.detail.resolvedDone}
          </div>
        )}
      </div>

      {/* Timeline */}
      <div
        style={{
          borderTop: '1px solid #e2e8f0',
          paddingTop: 14,
          fontSize: 12.5,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          marginTop: 'auto',
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 2, color: '#475569' }}>
          {t.detail.history}
        </div>
        <div>
          <span style={{ color: '#94a3b8' }}>{t.detail.createdAt}</span>
          <span>{new Date(ticket.openedAt).toLocaleString(locale)}</span>
        </div>
        {ticket.resolvedAt && (
          <div>
            <span style={{ color: '#94a3b8' }}>{t.detail.resolvedAt}</span>
            <span>{new Date(ticket.resolvedAt).toLocaleString(locale)}</span>
          </div>
        )}
      </div>
    </div>
  )
}

const SEVERITIES: TicketSeverity[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

// [PROPOSED] Not backend/mock data — hard-coded demo operator, name kept as-is.
function systemOperatorList(lang: Language) {
  return [
    {
      id: '00000000-0000-0000-0000-000000000004',
      name: 'Seed System Operator',
      email: 'seed.system.operator@odms.local',
      role: lang === 'en' ? 'STAFF (Technician)' : 'STAFF (Kỹ thuật viên)',
      status: lang === 'en' ? 'Available' : 'Sẵn sàng',
    },
  ]
}

function AssignModal({
  ticket,
  onClose,
  onAssigned,
}: {
  ticket: MaintenanceTicket
  onClose: () => void
  onAssigned: (ticket: MaintenanceTicket) => void
}) {
  const { t, lang } = useI18n(maintenancePageMessages)
  const [techId, setTechId] = useState('00000000-0000-0000-0000-000000000004')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const operatorList = systemOperatorList(lang)

  async function handleAssign() {
    setSaving(true)
    setError(null)
    try {
      const updated = await maintenanceApi.assignTechnician(ticket.id, techId)
      onAssigned(updated)
    } catch (e) {
      setError(e instanceof Error ? e.message : t.assignModal.failed)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.5)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        className="odm-card"
        style={{
          padding: 24,
          width: 500,
          borderRadius: 16,
          boxShadow:
            '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: 17,
              fontWeight: 700,
              color: '#0f172a',
            }}
          >
            {t.assignModal.title}
          </h3>
          <button
            type="button"
            className="odm-btn"
            onClick={onClose}
            style={{ padding: '2px 8px', borderRadius: '50%' }}
          >
            ✕
          </button>
        </div>

        <div
          style={{
            background: '#f8fafc',
            padding: 12,
            borderRadius: 10,
            marginBottom: 18,
            border: '1px solid #e2e8f0',
            fontSize: 13,
          }}
        >
          <div>
            {t.assignModal.ticketLabel}
            <b className="odm-mono">{ticket.code}</b>
            {t.assignModal.droneLabel}
            <b>{ticket.droneCode}</b>
          </div>
          <div style={{ color: '#64748b', marginTop: 2 }}>
            {formatTicketTitle(ticket.title)}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            marginBottom: 20,
          }}
        >
          <label style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>
            {t.assignModal.chooseOperator}
          </label>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {operatorList.map((op) => {
              const selected = techId === op.id
              return (
                <div
                  key={op.id}
                  onClick={() => setTechId(op.id)}
                  style={{
                    padding: 12,
                    borderRadius: 10,
                    border: selected
                      ? '2px solid #2563eb'
                      : '1px solid #e2e8f0',
                    background: selected ? '#eff6ff' : '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 12 }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: selected ? '#2563eb' : '#f1f5f9',
                        color: selected ? '#ffffff' : '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: 14,
                      }}
                    >
                      {op.name.charAt(0)}
                    </div>
                    <div>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: 13.5,
                          color: '#0f172a',
                        }}
                      >
                        {op.name}
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>
                        {op.role}
                      </div>
                    </div>
                  </div>

                  <input
                    type="radio"
                    name="technician"
                    checked={selected}
                    onChange={() => setTechId(op.id)}
                    style={{ width: 16, height: 16, accentColor: '#2563eb' }}
                  />
                </div>
              )
            })}
          </div>
        </div>

        {error && (
          <div
            style={{
              color: '#ef4444',
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 14,
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="odm-btn"
            onClick={onClose}
            disabled={saving}
          >
            {t.assignModal.cancel}
          </button>
          <button
            type="button"
            className="odm-btn odm-btn-p"
            onClick={handleAssign}
            disabled={saving}
            style={{
              fontWeight: 600,
              height: 38,
              padding: '0 18px',
              borderRadius: 8,
            }}
          >
            {saving ? t.assignModal.assigning : t.assignModal.confirm}
          </button>
        </div>
      </div>
    </div>
  )
}

type CreateModalProps = {
  onClose: () => void
  onCreate: (ticket: MaintenanceTicket) => void
}

function CreateModal({ onClose, onCreate }: CreateModalProps) {
  const { t, lang } = useI18n(maintenancePageMessages)
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
      setError(e instanceof Error ? e.message : t.createModal.unknownError)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.5)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        className="odm-card"
        style={{
          padding: 24,
          width: 460,
          borderRadius: 16,
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ margin: '0 0 16px', fontSize: 17, fontWeight: 700 }}>
          {t.createModal.title}
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label
              htmlFor="ct-drone"
              style={{
                fontSize: 12.5,
                fontWeight: 600,
                color: '#334155',
                display: 'block',
                marginBottom: 4,
              }}
            >
              {t.createModal.droneId}
            </label>
            <input
              id="ct-drone"
              className="odm-input"
              value={droneId}
              onChange={(e) => setDroneId(e.target.value)}
              placeholder={t.createModal.droneIdPlaceholder}
              style={{ width: '100%', borderRadius: 8 }}
            />
          </div>
          <div>
            <label
              htmlFor="ct-title"
              style={{
                fontSize: 12.5,
                fontWeight: 600,
                color: '#334155',
                display: 'block',
                marginBottom: 4,
              }}
            >
              {t.createModal.issueTitle}
            </label>
            <input
              id="ct-title"
              className="odm-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t.createModal.issueTitlePlaceholder}
              style={{ width: '100%', borderRadius: 8 }}
            />
          </div>
          <div>
            <label
              htmlFor="ct-priority"
              style={{
                fontSize: 12.5,
                fontWeight: 600,
                color: '#334155',
                display: 'block',
                marginBottom: 4,
              }}
            >
              {t.createModal.priority}
            </label>
            <select
              id="ct-priority"
              className="odm-input"
              value={priority}
              onChange={(e) => setPriority(e.target.value as TicketSeverity)}
              style={{ width: '100%', borderRadius: 8 }}
            >
              {SEVERITIES.map((s) => (
                <option key={s} value={s}>
                  {getTicketSeverityLabel(s, lang)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="ct-issue"
              style={{
                fontSize: 12.5,
                fontWeight: 600,
                color: '#334155',
                display: 'block',
                marginBottom: 4,
              }}
            >
              {t.createModal.issueType}
            </label>
            <input
              id="ct-issue"
              className="odm-input"
              value={issueType}
              onChange={(e) => setIssueType(e.target.value)}
              placeholder={t.createModal.issueTypePlaceholder}
              style={{ width: '100%', borderRadius: 8 }}
            />
          </div>
          <div>
            <label
              htmlFor="ct-desc"
              style={{
                fontSize: 12.5,
                fontWeight: 600,
                color: '#334155',
                display: 'block',
                marginBottom: 4,
              }}
            >
              {t.createModal.description}
            </label>
            <textarea
              id="ct-desc"
              className="odm-input"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t.createModal.descriptionPlaceholder}
              style={{ width: '100%', resize: 'vertical', borderRadius: 8 }}
            />
          </div>

          {error && (
            <div style={{ color: '#ef4444', fontSize: 13, fontWeight: 600 }}>
              {error}
            </div>
          )}

          <div
            style={{
              display: 'flex',
              gap: 8,
              justifyContent: 'flex-end',
              marginTop: 8,
            }}
          >
            <button
              type="button"
              className="odm-btn"
              onClick={onClose}
              disabled={saving}
            >
              {t.createModal.cancel}
            </button>
            <button
              type="button"
              className="odm-btn odm-btn-p"
              onClick={handleCreate}
              disabled={saving}
              style={{ fontWeight: 600, borderRadius: 8 }}
            >
              {saving ? t.createModal.creating : t.createModal.create}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function MaintenancePage() {
  const { t, lang } = useI18n(maintenancePageMessages)
  const [tickets, setTickets] = useState<MaintenanceTicket[] | null>(null)
  const [selectedTicket, setSelectedTicket] =
    useState<MaintenanceTicket | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [assignTicket, setAssignTicket] = useState<MaintenanceTicket | null>(
    null,
  )

  // Manager Search & Filter controls state
  const [searchQuery, setSearchQuery] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL')
  const [assignedFilter, setAssignedFilter] = useState<string>('ALL')

  const query = useApiQuery(
    (signal) => maintenanceApi.listTickets({ signal }),
    [],
  )

  const allTickets = tickets ?? query.data?.items ?? []

  // Filtered tickets based on search query, priority, and assignment status
  const filteredTickets = useMemo(() => {
    return allTickets.filter((t) => {
      // Search text check
      const q = searchQuery.toLowerCase().trim()
      const matchQuery =
        !q ||
        t.code.toLowerCase().includes(q) ||
        t.droneCode.toLowerCase().includes(q) ||
        t.title.toLowerCase().includes(q) ||
        (t.assignedTo && t.assignedTo.toLowerCase().includes(q))

      // Priority check
      const matchPriority =
        priorityFilter === 'ALL' || t.priority === priorityFilter

      // Assigned check
      const matchAssigned =
        assignedFilter === 'ALL' ||
        (assignedFilter === 'UNASSIGNED' && !t.assignedTo) ||
        (assignedFilter === 'ASSIGNED' && !!t.assignedTo)

      return matchQuery && matchPriority && matchAssigned
    })
  }, [allTickets, searchQuery, priorityFilter, assignedFilter])

  const byColumn = useMemo(() => {
    const map: Record<TicketStatus, MaintenanceTicket[]> = {
      OPEN: [],
      IN_PROGRESS: [],
      RESOLVED: [],
      CLOSED: [],
    }
    for (const t of filteredTickets) {
      map[t.status]?.push(t)
    }
    return map
  }, [filteredTickets])

  const unassignedCount = allTickets.filter(
    (t) => (t.status === 'OPEN' || t.status === 'IN_PROGRESS') && !t.assignedTo,
  ).length
  const urgentCount = allTickets.filter(
    (t) =>
      (t.status === 'OPEN' || t.status === 'IN_PROGRESS') &&
      (t.priority === 'CRITICAL' || t.priority === 'HIGH'),
  ).length
  const resolvedCount = allTickets.filter(
    (t) => t.status === 'RESOLVED' || t.status === 'CLOSED',
  ).length

  function handleTicketUpdated(updated: MaintenanceTicket) {
    const base = tickets ?? query.data?.items ?? []
    setTickets(base.map((t) => (t.id === updated.id ? updated : t)))
    if (selectedTicket?.id === updated.id) {
      setSelectedTicket(updated)
    }
    setAssignTicket(null)
  }

  function handleCreated(ticket: MaintenanceTicket) {
    const base = tickets ?? query.data?.items ?? []
    setTickets([ticket, ...base])
    setShowCreate(false)
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: '0 4px',
      }}
    >
      {/* Header Banner & Stats */}
      <div
        style={{
          padding: '20px 24px',
          borderRadius: 14,
          background: '#0f172a',
          color: '#ffffff',
          boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 700,
              color: '#f8fafc',
            }}
          >
            {t.page.title}
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#94a3b8' }}>
            {t.page.subtitle}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              padding: '6px 14px',
              borderRadius: 10,
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 11, color: '#94a3b8' }}>
              {t.page.unassignedStat}
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: unassignedCount > 0 ? '#f87171' : '#f8fafc',
              }}
            >
              {unassignedCount}
            </div>
          </div>

          <div
            style={{
              padding: '6px 14px',
              borderRadius: 10,
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 11, color: '#94a3b8' }}>
              {t.page.urgentStat}
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fbbf24' }}>
              {urgentCount}
            </div>
          </div>

          <div
            style={{
              padding: '6px 14px',
              borderRadius: 10,
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 11, color: '#94a3b8' }}>
              {t.page.resolvedStat}
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#34d399' }}>
              {resolvedCount}
            </div>
          </div>

          <button
            type="button"
            className="odm-btn odm-btn-p"
            onClick={() => setShowCreate(true)}
            style={{
              fontWeight: 600,
              padding: '9px 16px',
              borderRadius: 10,
              height: 40,
            }}
          >
            {t.page.createButton}
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          marginBottom: 16,
          background: '#ffffff',
          padding: '10px 16px',
          borderRadius: 12,
          border: '1px solid #e2e8f0',
        }}
      >
        <div style={{ flex: 1 }}>
          <input
            className="odm-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.page.searchPlaceholder}
            style={{
              width: '100%',
              height: 38,
              borderRadius: 8,
              paddingLeft: 12,
              fontSize: 13,
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: '#64748b' }}>
            {t.page.priorityLabel}
          </span>
          <select
            className="odm-input"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            style={{ height: 38, borderRadius: 8, fontSize: 13 }}
          >
            <option value="ALL">{t.page.priorityAll}</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          <span style={{ fontSize: 13, color: '#64748b' }}>
            {t.page.assignedLabel}
          </span>
          <select
            className="odm-input"
            value={assignedFilter}
            onChange={(e) => setAssignedFilter(e.target.value)}
            style={{ height: 38, borderRadius: 8, fontSize: 13 }}
          >
            <option value="ALL">{t.page.assignedAll}</option>
            <option value="UNASSIGNED">{t.page.assignedUnassigned}</option>
            <option value="ASSIGNED">{t.page.assignedAssigned}</option>
          </select>
        </div>
      </div>

      {/* Content */}
      {query.loading && (
        <div style={{ padding: 40, textAlign: 'center' }} aria-busy="true">
          <div className="odm-sk" style={{ height: 300, borderRadius: 12 }} />
        </div>
      )}

      {!query.loading && !!query.error && (
        <div style={{ padding: 24 }}>
          <StateView
            state="error"
            title={t.page.loadError}
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
              gap: 14,
              overflowX: 'auto',
              padding: '4px 0',
            }}
          >
            {COLUMNS.map((col) => (
              <div
                key={col}
                style={{
                  minWidth: 260,
                  flex: '1 1 260px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  background: '#f8fafc',
                  padding: 12,
                  borderRadius: 14,
                  border: '1px solid #e2e8f0',
                }}
              >
                <div
                  style={{
                    padding: '2px 4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <StatusBadge tone={ticketStatusTone[col]}>
                    {getTicketStatusLabel(col, lang)}
                  </StatusBadge>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#475569',
                      background: '#ffffff',
                      borderRadius: 10,
                      padding: '2px 8px',
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    {byColumn[col].length}
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    overflowY: 'auto',
                    flex: 1,
                  }}
                >
                  {byColumn[col].length === 0 && (
                    <div
                      style={{
                        fontSize: 12.5,
                        color: '#94a3b8',
                        textAlign: 'center',
                        padding: '24px 12px',
                        background: '#ffffff',
                        borderRadius: 10,
                        border: '1px dashed #cbd5e1',
                      }}
                    >
                      {t.page.noTickets}
                    </div>
                  )}
                  {byColumn[col].map((ticket) => (
                    <TicketCard
                      key={ticket.id}
                      ticket={ticket}
                      selected={selectedTicket?.id === ticket.id}
                      onSelect={setSelectedTicket}
                      onAssignClick={(t) => setAssignTicket(t)}
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
              onAssignClick={(t) => setAssignTicket(t)}
            />
          )}
        </div>
      )}

      {/* Modals */}
      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onCreate={handleCreated}
        />
      )}

      {assignTicket && (
        <AssignModal
          ticket={assignTicket}
          onClose={() => setAssignTicket(null)}
          onAssigned={handleTicketUpdated}
        />
      )}
    </div>
  )
}
