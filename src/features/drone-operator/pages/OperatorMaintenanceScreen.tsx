import { useMemo, useState } from 'react'

import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../shared/i18n'
import { authSession } from '../../auth/api/authApi'
import {
  maintenanceTicketApi,
  type MaintenanceTicketDto,
} from '../api/maintenanceTicketApi'
import { operatorMaintenanceScreenMessages } from './OperatorMaintenanceScreen.messages'

export function OperatorMaintenanceScreen() {
  const { t, locale } = useI18n(operatorMaintenanceScreenMessages)
  const user = authSession.getUser()
  const [activeTab, setActiveTab] = useState<
    'MY_TICKETS' | 'ALL_ACTIVE' | 'RESOLVED'
  >('MY_TICKETS')
  const [selectedTicket, setSelectedTicket] =
    useState<MaintenanceTicketDto | null>(null)
  const [notes, setNotes] = useState('')
  const [targetDroneStatus, setTargetDroneStatus] = useState('AVAILABLE')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const query = useApiQuery(
    (signal) =>
      maintenanceTicketApi.listTickets(undefined, undefined, undefined, signal),
    [],
  )

  const allTickets = query.data || []

  const filteredTickets = useMemo(() => {
    if (activeTab === 'MY_TICKETS') {
      return allTickets.filter(
        (t) =>
          (t.assignedTechnicianId === user?.id ||
            t.assignedTechnicianName === user?.fullName) &&
          (t.status === 'OPEN' || t.status === 'IN_PROGRESS'),
      )
    }
    if (activeTab === 'ALL_ACTIVE') {
      return allTickets.filter(
        (t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS',
      )
    }
    return allTickets.filter(
      (t) => t.status === 'RESOLVED' || t.status === 'CLOSED',
    )
  }, [allTickets, activeTab, user])

  const myOpenCount = allTickets.filter(
    (t) =>
      (t.assignedTechnicianId === user?.id ||
        t.assignedTechnicianName === user?.fullName) &&
      (t.status === 'OPEN' || t.status === 'IN_PROGRESS'),
  ).length

  async function handleResolveSubmit() {
    if (!selectedTicket) return
    if (!notes.trim()) {
      setError(t.notesRequiredError)
      return
    }

    setSaving(true)
    setError(null)

    try {
      await maintenanceTicketApi.resolveTicket(selectedTicket.id, {
        resolutionNotes: notes,
        newDroneStatus: targetDroneStatus,
      })

      setSuccessMsg(
        t.resolveSuccess(
          selectedTicket.ticketCode,
          selectedTicket.deviceId || '',
          targetDroneStatus,
        ),
      )
      setSelectedTicket(null)
      setNotes('')
      query.reload()
    } catch (e) {
      setError(e instanceof Error ? e.message : t.resolveFailed)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header Banner */}
      <div
        style={{
          padding: '20px 24px',
          borderRadius: 14,
          background: '#0f172a',
          color: '#ffffff',
          boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
          marginBottom: 24,
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
            {t.headerTitle}
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#94a3b8' }}>
            {t.headerSubtitle}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
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
              {t.needsAction}
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fbbf24' }}>
              {myOpenCount}
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
              {t.totalTickets}
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#38bdf8' }}>
              {allTickets.length}
            </div>
          </div>
        </div>
      </div>

      {successMsg && (
        <div
          role="alert"
          style={{
            padding: '12px 16px',
            borderRadius: 10,
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            color: '#166534',
            fontSize: 13.5,
            fontWeight: 600,
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>{successMsg}</span>
          <button
            type="button"
            className="odm-btn"
            style={{ padding: '2px 8px', fontSize: 12 }}
            onClick={() => setSuccessMsg(null)}
          >
            {t.close}
          </button>
        </div>
      )}

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          borderBottom: '1px solid #e2e8f0',
          marginBottom: 20,
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('MY_TICKETS')}
          style={{
            padding: '10px 16px',
            background: 'none',
            border: 'none',
            borderBottom:
              activeTab === 'MY_TICKETS'
                ? '2px solid #2563eb'
                : '2px solid transparent',
            fontWeight: activeTab === 'MY_TICKETS' ? 700 : 500,
            color: activeTab === 'MY_TICKETS' ? '#2563eb' : '#64748b',
            cursor: 'pointer',
            fontSize: 13.5,
            transition: 'all 0.15s ease',
          }}
        >
          {t.tabMine(myOpenCount)}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('ALL_ACTIVE')}
          style={{
            padding: '10px 16px',
            background: 'none',
            border: 'none',
            borderBottom:
              activeTab === 'ALL_ACTIVE'
                ? '2px solid #2563eb'
                : '2px solid transparent',
            fontWeight: activeTab === 'ALL_ACTIVE' ? 700 : 500,
            color: activeTab === 'ALL_ACTIVE' ? '#2563eb' : '#64748b',
            cursor: 'pointer',
            fontSize: 13.5,
          }}
        >
          {t.tabAllActive(
            allTickets.filter(
              (ticket) =>
                ticket.status === 'OPEN' || ticket.status === 'IN_PROGRESS',
            ).length,
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('RESOLVED')}
          style={{
            padding: '10px 16px',
            background: 'none',
            border: 'none',
            borderBottom:
              activeTab === 'RESOLVED'
                ? '2px solid #2563eb'
                : '2px solid transparent',
            fontWeight: activeTab === 'RESOLVED' ? 700 : 500,
            color: activeTab === 'RESOLVED' ? '#2563eb' : '#64748b',
            cursor: 'pointer',
            fontSize: 13.5,
          }}
        >
          {t.tabResolved(
            allTickets.filter(
              (ticket) =>
                ticket.status === 'RESOLVED' || ticket.status === 'CLOSED',
            ).length,
          )}
        </button>
      </div>

      {/* Ticket List */}
      {query.loading ? (
        <div style={{ padding: 40, textAlign: 'center' }}>
          <div
            className="odm-sk"
            style={{ height: 120, borderRadius: 12, marginBottom: 12 }}
          />
          <div className="odm-sk" style={{ height: 120, borderRadius: 12 }} />
        </div>
      ) : filteredTickets.length === 0 ? (
        <div
          className="odm-card"
          style={{
            padding: '48px 24px',
            textAlign: 'center',
            color: '#94a3b8',
            borderRadius: 14,
            border: '1px solid #e2e8f0',
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: 15,
              color: '#1e293b',
              fontWeight: 600,
            }}
          >
            {t.emptyTitle}
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: 13 }}>{t.emptyBody}</p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: 16,
          }}
        >
          {filteredTickets.map((ticket) => (
            <div
              key={ticket.id}
              className="odm-card"
              style={{
                padding: 18,
                borderRadius: 12,
                border: '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 12,
                background: '#ffffff',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
              }}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 10,
                  }}
                >
                  <span
                    className="odm-mono"
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 6,
                      background: '#f1f5f9',
                      color: '#334155',
                    }}
                  >
                    {ticket.ticketCode}
                  </span>
                  <span
                    style={{
                      fontSize: 11.5,
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: 6,
                      background:
                        ticket.severity === 'HIGH' ||
                        ticket.severity === 'CRITICAL'
                          ? '#fef2f2'
                          : '#fefce8',
                      color:
                        ticket.severity === 'HIGH' ||
                        ticket.severity === 'CRITICAL'
                          ? '#ef4444'
                          : '#b45309',
                      border: `1px solid ${ticket.severity === 'HIGH' || ticket.severity === 'CRITICAL' ? '#fecaca' : '#fef08a'}`,
                    }}
                  >
                    {ticket.severity || 'MEDIUM'}
                  </span>
                </div>

                <h3
                  style={{
                    margin: '0 0 8px',
                    fontSize: 15,
                    fontWeight: 700,
                    color: '#0f172a',
                  }}
                >
                  {ticket.description || ticket.issueType || t.defaultIssue}
                </h3>

                <div
                  style={{
                    fontSize: 13,
                    color: '#475569',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  <div>
                    {t.droneLabel}{' '}
                    <b>{ticket.deviceId || 'DEVICE'}</b>
                  </div>
                  <div>
                    {t.technicianLabel}{' '}
                    <b>{ticket.assignedTechnicianName || t.unassigned}</b>
                  </div>
                  {ticket.resolutionNotes && (
                    <div
                      style={{
                        background: '#f8fafc',
                        padding: '8px 10px',
                        borderRadius: 8,
                        marginTop: 4,
                        fontSize: 12.5,
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      <b style={{ color: '#334155' }}>{t.reportLabel}</b>{' '}
                      {ticket.resolutionNotes}
                    </div>
                  )}
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTop: '1px solid #f1f5f9',
                  paddingTop: 12,
                }}
              >
                <span style={{ fontSize: 12, color: '#94a3b8' }}>
                  {ticket.openedAt
                    ? new Date(ticket.openedAt).toLocaleDateString(locale)
                    : ''}
                </span>

                {ticket.status === 'RESOLVED' || ticket.status === 'CLOSED' ? (
                  <span
                    style={{
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: '#059669',
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
                    {t.resolved}
                  </span>
                ) : (
                  <button
                    type="button"
                    className="odm-btn odm-btn-p"
                    onClick={() => {
                      setSelectedTicket(ticket)
                      setError(null)
                    }}
                    style={{
                      fontSize: 12.5,
                      fontWeight: 600,
                      padding: '7px 14px',
                      borderRadius: 8,
                    }}
                  >
                    {t.updateAndRestore}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Resolution Modal */}
      {selectedTicket && (
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
          onClick={() => setSelectedTicket(null)}
        >
          <div
            className="odm-card"
            style={{
              padding: 24,
              width: 500,
              borderRadius: 16,
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
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
                {t.modalTitle}
              </h3>
              <button
                type="button"
                className="odm-btn"
                onClick={() => setSelectedTicket(null)}
                style={{ padding: '2px 8px', borderRadius: '50%' }}
              >
                ✕
              </button>
            </div>

            <div
              style={{
                background: '#f8fafc',
                padding: 12,
                borderRadius: 8,
                marginBottom: 16,
                border: '1px solid #e2e8f0',
                fontSize: 13,
              }}
            >
              <div>
                {t.modalTicketPrefix}{' '}
                <b className="odm-mono">{selectedTicket.ticketCode}</b> ·{' '}
                {t.modalDronePrefix}{' '}
                <b>{selectedTicket.deviceId || 'DEVICE'}</b>
              </div>
              <div style={{ color: '#64748b', marginTop: 2 }}>
                {selectedTicket.description}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#334155',
                    display: 'block',
                    marginBottom: 6,
                  }}
                >
                  {t.notesLabel}
                </label>
                <textarea
                  className="odm-input"
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t.notesPlaceholder}
                  style={{
                    width: '100%',
                    resize: 'vertical',
                    borderRadius: 8,
                    padding: 10,
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#334155',
                    display: 'block',
                    marginBottom: 6,
                  }}
                >
                  {t.droneStatusLabel}
                </label>
                <select
                  className="odm-input"
                  value={targetDroneStatus}
                  onChange={(e) => setTargetDroneStatus(e.target.value)}
                  style={{
                    width: '100%',
                    height: 40,
                    borderRadius: 8,
                    fontWeight: 600,
                    fontSize: 13,
                  }}
                >
                  <option value="AVAILABLE">
                    {t.droneStatusOptions.AVAILABLE}
                  </option>
                  <option value="IDLE_CHARGING">
                    {t.droneStatusOptions.IDLE_CHARGING}
                  </option>
                  <option value="MAINTENANCE">
                    {t.droneStatusOptions.MAINTENANCE}
                  </option>
                </select>
              </div>

              {error && (
                <div
                  style={{ color: '#ef4444', fontSize: 13, fontWeight: 600 }}
                >
                  {error}
                </div>
              )}

              <div
                style={{
                  display: 'flex',
                  gap: 10,
                  justifyContent: 'flex-end',
                  marginTop: 8,
                }}
              >
                <button
                  type="button"
                  className="odm-btn"
                  onClick={() => setSelectedTicket(null)}
                  disabled={saving}
                >
                  {t.cancel}
                </button>
                <button
                  type="button"
                  className="odm-btn odm-btn-p"
                  onClick={handleResolveSubmit}
                  disabled={saving}
                  style={{
                    fontWeight: 600,
                    height: 38,
                    padding: '0 18px',
                    borderRadius: 8,
                  }}
                >
                  {saving ? t.processing : t.confirmRestore}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
