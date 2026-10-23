import type { MaintenanceTicket } from '../../../types/maintenance'
import { useI18n } from '../../../../../shared/i18n'
import { maintenancePageMessages } from '../MaintenancePage.messages'
import { useState } from 'react'
import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import { maintenanceApi } from '../../../api/maintenanceApi'
import { formatTicketTitle } from '../../../lib/ticketText'
import { Button, useToast } from '../../../../../shared/components/ui'
import { managerFeedbackMessages } from '../../../feedback.messages'

export function AssignModal({
  ticket,
  onClose,
  onAssigned,
}: {
  ticket: MaintenanceTicket
  onClose: () => void
  onAssigned: (ticket: MaintenanceTicket) => void
}) {
  const { t } = useI18n(maintenancePageMessages)
  const { t: fb } = useI18n(managerFeedbackMessages)
  const toast = useToast()
  const staffQuery = useApiQuery(
    (signal) => maintenanceApi.listAssignableStaff(signal),
    [],
  )
  const [techId, setTechId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const staffList = staffQuery.data ?? []

  async function handleAssign() {
    if (!techId) return
    setSaving(true)
    setError(null)
    try {
      const updated = await maintenanceApi.assignTechnician(ticket.id, techId)
      toast.success(fb.technicianAssigned)
      onAssigned(updated)
    } catch (e) {
      const failure = e instanceof Error ? e.message : t.assignModal.failed
      setError(failure)
      toast.error(failure)
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
          <Button
            type="button"
            onClick={onClose}
            style={{ padding: '2px 8px', borderRadius: '50%' }}
          >
            ✕
          </Button>
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
            {staffQuery.loading && (
              <div style={{ fontSize: 13, color: '#64748b' }} aria-busy="true">
                {t.assignModal.loadingStaff}
              </div>
            )}
            {!staffQuery.loading && !!staffQuery.error && (
              <div style={{ fontSize: 13, color: '#ef4444' }} role="alert">
                {t.assignModal.staffLoadError}{' '}
                <Button
                  type="button"
                  onClick={staffQuery.reload}
                >
                  {t.assignModal.retry}
                </Button>
              </div>
            )}
            {!staffQuery.loading && !staffQuery.error && staffList.length === 0 && (
              <div style={{ fontSize: 13, color: '#64748b' }}>
                {t.assignModal.noStaff}
              </div>
            )}
            {staffList.map((op) => {
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
                      {op.fullName.charAt(0)}
                    </div>
                    <div>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: 13.5,
                          color: '#0f172a',
                        }}
                      >
                        {op.fullName}
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>
                        {op.email}
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
          <Button
            type="button"
            onClick={onClose}
            disabled={saving}
          >
            {t.assignModal.cancel}
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleAssign}
            disabled={saving || !techId}
            style={{
              fontWeight: 600,
              height: 38,
              padding: '0 18px',
              borderRadius: 8,
            }}
          >
            {saving ? t.assignModal.assigning : t.assignModal.confirm}
          </Button>
        </div>
      </div>
    </div>
  )
}
