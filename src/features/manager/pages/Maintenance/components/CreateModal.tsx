import { useI18n } from '../../../../../shared/i18n'
import { useState } from 'react'
import { FormField, Modal } from '../../../../../shared/components/ui'
import type { TicketSeverity } from '../../../../../shared/types/domain'
import { maintenanceApi } from '../../../api/maintenanceApi'
import { SEVERITIES } from '../maintenanceHelpers'
import { getTicketSeverityLabel } from '../../../../../shared/lib/statusTone'
import type { MaintenanceTicket } from '../../../types/maintenance'
import { createModalMessages } from './CreateModal.messages'

type CreateModalProps = {
  onClose: () => void
  onCreate: (ticket: MaintenanceTicket) => void
}

export function CreateModal({ onClose, onCreate }: CreateModalProps) {
  const { t, lang } = useI18n(createModalMessages)
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
    <Modal
      title={t.createModal.title}
      icon="ticket"
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
            {t.createModal.cancel}
          </button>
          <button
            type="button"
            className="odm-btn odm-btn-p"
            onClick={handleCreate}
            disabled={saving}
          >
            {saving ? t.createModal.creating : t.createModal.create}
          </button>
        </>
      }
    >
      <FormField id="ct-drone" label={t.createModal.droneId} required>
        <input
          id="ct-drone"
          className="odm-inp"
          value={droneId}
          onChange={(e) => setDroneId(e.target.value)}
          placeholder={t.createModal.droneIdPlaceholder}
        />
      </FormField>
      <FormField id="ct-title" label={t.createModal.issueTitle} required>
        <input
          id="ct-title"
          className="odm-inp"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t.createModal.issueTitlePlaceholder}
        />
      </FormField>
      <FormField id="ct-priority" label={t.createModal.priority}>
        <select
          id="ct-priority"
          className="odm-inp"
          value={priority}
          onChange={(e) => setPriority(e.target.value as TicketSeverity)}
        >
          {SEVERITIES.map((s) => (
            <option key={s} value={s}>
              {getTicketSeverityLabel(s, lang)}
            </option>
          ))}
        </select>
      </FormField>
      <FormField id="ct-issue" label={t.createModal.issueType}>
        <input
          id="ct-issue"
          className="odm-inp"
          value={issueType}
          onChange={(e) => setIssueType(e.target.value)}
          placeholder={t.createModal.issueTypePlaceholder}
        />
      </FormField>
      <FormField
        id="ct-desc"
        label={t.createModal.description}
        error={error ?? undefined}
      >
        <textarea
          id="ct-desc"
          className="odm-inp"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t.createModal.descriptionPlaceholder}
        />
      </FormField>
    </Modal>
  )
}
