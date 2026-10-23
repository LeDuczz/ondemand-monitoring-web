import { useState, type FormEvent } from 'react'

import {
  Button,
  FormField,
  Modal,
  useToast,
} from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import { getDroneStatusLabel } from '../../../../../shared/lib/statusTone'
import type { DroneStatus } from '../../../../../shared/types/domain'
import { maintenanceApi } from '../../../api/maintenanceApi'
import { formatTicketTitle } from '../../../lib/ticketText'
import type { MaintenanceTicket } from '../../../types/maintenance'
import { maintenancePageMessages } from '../MaintenancePage.messages'

/** Device statuses a drone can return to once maintenance is finished. */
const RESULT_STATUSES: DroneStatus[] = ['AVAILABLE', 'OUT_OF_SERVICE', 'OFFLINE']

export function ResolveModal({
  ticket,
  onClose,
  onResolved,
}: {
  ticket: MaintenanceTicket
  onClose: () => void
  onResolved: (ticket: MaintenanceTicket) => void
}) {
  const { t, lang } = useI18n(maintenancePageMessages)
  const toast = useToast()
  const [notes, setNotes] = useState('')
  const [deviceStatus, setDeviceStatus] = useState<DroneStatus>('AVAILABLE')
  const [touched, setTouched] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const notesError =
    touched && !notes.trim() ? t.resolveModal.notesRequired : undefined

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setTouched(true)
    if (!notes.trim()) return
    setSaving(true)
    setError(null)
    try {
      const updated = await maintenanceApi.resolveTicket(
        ticket.id,
        notes.trim(),
        deviceStatus,
      )
      toast.success(t.resolveModal.success)
      onResolved(updated)
    } catch (err) {
      const failure = err instanceof Error ? err.message : t.resolveModal.failed
      setError(failure)
      toast.error(failure)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      width={480}
      icon="check"
      tone="success"
      title={t.resolveModal.title}
      subtitle={`${ticket.code} · ${ticket.droneCode} · ${formatTicketTitle(ticket.title)}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            {t.resolveModal.cancel}
          </Button>
          <Button
            type="submit"
            form="maintenance-resolve-form"
            variant="primary"
            disabled={saving}
          >
            {saving ? t.resolveModal.saving : t.resolveModal.confirm}
          </Button>
        </>
      }
    >
      <form
        id="maintenance-resolve-form"
        className="odm-or-modal-stack"
        onSubmit={handleSubmit}
        noValidate
      >
        <FormField
          id="maintenance-resolution-notes"
          label={t.resolveModal.notes}
          required
          error={notesError}
        >
          <textarea
            id="maintenance-resolution-notes"
            className="odm-inp odm-or-textarea"
            rows={4}
            value={notes}
            placeholder={t.resolveModal.notesPlaceholder}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={() => setTouched(true)}
          />
        </FormField>
        <FormField id="maintenance-device-status" label={t.resolveModal.deviceStatus}>
          <select
            id="maintenance-device-status"
            className="odm-inp"
            value={deviceStatus}
            onChange={(e) => setDeviceStatus(e.target.value as DroneStatus)}
          >
            {RESULT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {getDroneStatusLabel(s, lang)}
              </option>
            ))}
          </select>
        </FormField>
        {error && (
          <div role="alert" className="ui-field-error">
            {error}
          </div>
        )}
      </form>
    </Modal>
  )
}
