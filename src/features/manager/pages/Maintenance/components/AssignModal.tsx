import type { MaintenanceTicket } from '../../../types/maintenance'
import { useI18n } from '../../../../../shared/i18n'
import { useState } from 'react'
import { FormField, Modal } from '../../../../../shared/components/ui'
import { systemOperatorList } from '../maintenanceHelpers'
import { maintenanceApi } from '../../../api/maintenanceApi'
import { formatTicketTitle } from '../../../lib/ticketText'
import { assignModalMessages } from './AssignModal.messages'

export function AssignModal({
  ticket,
  onClose,
  onAssigned,
}: {
  ticket: MaintenanceTicket
  onClose: () => void
  onAssigned: (ticket: MaintenanceTicket) => void
}) {
  const { t, lang } = useI18n(assignModalMessages)
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
    <Modal
      title={t.assignModal.title}
      icon="users"
      width={480}
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            className="odm-btn odm-btn-gh"
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
          >
            {saving ? t.assignModal.assigning : t.assignModal.confirm}
          </button>
        </>
      }
    >
      <div className="mng-panel-note">
        <div>
          {t.assignModal.ticketLabel}
          <b className="odm-mono">{ticket.code}</b>
          {t.assignModal.droneLabel}
          <b>{ticket.droneCode}</b>
        </div>
        <div className="mng-cell-sub">{formatTicketTitle(ticket.title)}</div>
      </div>

      <FormField
        id="assign-operator"
        label={t.assignModal.chooseOperator}
        required
        error={error ?? undefined}
      >
        <div className="mng-pick-list" role="radiogroup" id="assign-operator">
          {operatorList.map((op) => (
            <label
              key={op.id}
              className={`mng-pick${techId === op.id ? ' is-selected' : ''}`}
            >
              <input
                type="radio"
                name="technician"
                checked={techId === op.id}
                onChange={() => setTechId(op.id)}
              />
              <span className="mng-pick-text">
                <span className="mng-cell-main">{op.name}</span>
                <span className="mng-cell-sub">{op.role}</span>
              </span>
            </label>
          ))}
        </div>
      </FormField>
    </Modal>
  )
}
