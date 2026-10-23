import { useState } from 'react'

import {
  Button,
  FormField,
  Modal,
  useToast,
} from '../../../../../shared/components/ui'
import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../../shared/i18n'
import { maintenanceApi } from '../../../api/maintenanceApi'
import { managerFeedbackMessages } from '../../../feedback.messages'
import { formatTicketTitle } from '../../../lib/ticketText'
import type { MaintenanceTicket } from '../../../types/maintenance'
import { maintenancePageMessages } from '../MaintenancePage.messages'

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
  const [techId, setTechId] = useState('')
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
    <Modal
      width={480}
      icon="users"
      title={t.assignModal.title}
      subtitle={`${ticket.code} · ${ticket.droneCode} · ${formatTicketTitle(ticket.title)}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            {t.assignModal.cancel}
          </Button>
          <Button
            variant="primary"
            onClick={handleAssign}
            disabled={saving || !techId}
          >
            {saving ? t.assignModal.assigning : t.assignModal.confirm}
          </Button>
        </>
      }
    >
      <div className="odm-or-modal-stack">
        {staffQuery.loading && (
          <div className="odm-or-modal-note" aria-busy="true">
            {t.assignModal.loadingStaff}
          </div>
        )}
        {!staffQuery.loading && !!staffQuery.error && (
          <div className="ui-field-error" role="alert">
            {t.assignModal.staffLoadError}{' '}
            <Button size="sm" onClick={staffQuery.reload}>
              {t.assignModal.retry}
            </Button>
          </div>
        )}
        {!staffQuery.loading && !staffQuery.error && staffList.length === 0 && (
          <div className="odm-or-modal-note">{t.assignModal.noStaff}</div>
        )}
        {staffList.length > 0 && (
          <FormField id="maintenance-operator" label={t.assignModal.chooseOperator} required>
            <select
              id="maintenance-operator"
              className="odm-inp"
              value={techId}
              onChange={(e) => setTechId(e.target.value)}
            >
              <option value="" />
              {staffList.map((op) => (
                <option key={op.id} value={op.id}>
                  {op.fullName} · {op.email}
                </option>
              ))}
            </select>
          </FormField>
        )}
        {error && (
          <div role="alert" className="ui-field-error">
            {error}
          </div>
        )}
      </div>
    </Modal>
  )
}
