import { useState } from 'react'

import {
  Button,
  FormField,
  Modal,
  useToast,
} from '../../../../../shared/components/ui'
import { StatusBadge } from '../../../../../shared/components/odm/StatusBadge'
import { useI18n } from '../../../../../shared/i18n'
import { droneStatusTone } from '../../../../../shared/lib/statusTone'
import type { DroneStatus } from '../../../../../shared/types/domain'
import { dronesApi } from '../../../api/dronesApi'
import { managerFeedbackMessages } from '../../../feedback.messages'
import type { DeviceResponse } from '../../../types/drones'
import { MANUAL_TRANSITIONS } from '../droneHelpers'
import { dronesPageMessages } from '../DronesPage.messages'
import { getDroneStatusLabel } from '../../../../../shared/lib/statusTone'

export type StatusChangeModalProps = {
  drone: DeviceResponse
  onClose: () => void
  onChanged: (updated: DeviceResponse) => void
}

export function StatusChangeModal({
  drone,
  onClose,
  onChanged,
}: StatusChangeModalProps) {
  const { t, lang } = useI18n(dronesPageMessages)
  const { t: fb } = useI18n(managerFeedbackMessages)
  const toast = useToast()
  const nextStatuses = MANUAL_TRANSITIONS[drone.status] ?? []
  const [selectedStatus, setSelectedStatus] = useState<DroneStatus | ''>(
    nextStatuses[0] ?? '',
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    if (!selectedStatus) return
    setSaving(true)
    setError(null)
    try {
      const updated = await dronesApi.updateDrone(drone.id, {
        serialNumber: drone.serialNumber,
        // Always send the full body so a PUT cannot clear name/model.
        // Null source values fall back to undefined (nothing to preserve).
        name: drone.name ?? undefined,
        modelId: drone.deviceModel?.id,
        status: selectedStatus,
      })
      toast.success(fb.droneUpdated)
      onChanged(updated)
    } catch (e) {
      const failure = e instanceof Error ? e.message : t.unknownError
      setError(failure)
      toast.error(failure)
    } finally {
      setSaving(false)
    }
  }

  const canSave = nextStatuses.length > 0
  return (
    <Modal
      width={440}
      icon="cpu"
      title={t.modal.title}
      subtitle={t.modal.subtitle(
        drone.serialNumber,
        drone.deviceModel?.modelName ?? '',
      )}
      onClose={onClose}
      footer={
        canSave ? (
          <>
            <Button variant="ghost" onClick={onClose} disabled={saving}>
              {t.modal.cancel}
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={saving || !selectedStatus}
            >
              {saving ? t.modal.saving : t.modal.confirm}
            </Button>
          </>
        ) : (
          <Button variant="ghost" onClick={onClose}>
            {t.modal.close}
          </Button>
        )
      }
    >
      {canSave ? (
        <div className="odm-or-modal-stack">
          <FormField id="drone-current-status" label={t.modal.current}>
            <div id="drone-current-status">
              <StatusBadge
                kind="drone"
                status={drone.status}
                tone={droneStatusTone[drone.status]}
              />
            </div>
          </FormField>
          <FormField id="drone-new-status" label={t.modal.newStatus} required>
            <select
              id="drone-new-status"
              className="odm-inp"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as DroneStatus)}
            >
              {nextStatuses.map((s) => (
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
        </div>
      ) : (
        <p className="odm-or-modal-note">
          {t.modal.cannotChange(getDroneStatusLabel(drone.status, lang))}
        </p>
      )}
    </Modal>
  )
}
