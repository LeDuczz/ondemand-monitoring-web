import { useI18n } from '../../../../../shared/i18n'
import { MANUAL_TRANSITIONS } from '../droneHelpers'
import { useState } from 'react'
import { FormField, Modal } from '../../../../../shared/components/ui'
import type { DroneStatus } from '../../../../../shared/types/domain'
import { dronesApi } from '../../../api/dronesApi'
import { getDroneStatusLabel } from '../../../../../shared/lib/statusTone'
import type { DroneResponse } from '../../../types/drones'
import { statusChangeModalMessages } from './StatusChangeModal.messages'

type StatusChangeModalProps = {
  drone: DroneResponse
  onClose: () => void
  onChanged: (updated: DroneResponse) => void
}

export function StatusChangeModal({
  drone,
  onClose,
  onChanged,
}: StatusChangeModalProps) {
  const { t, lang } = useI18n(statusChangeModalMessages)
  const nextStatuses = MANUAL_TRANSITIONS[drone.status] ?? []
  const [selectedStatus, setSelectedStatus] = useState<DroneStatus | ''>(
    nextStatuses[0] ?? '',
  )
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    if (!selectedStatus) return
    if (!reason.trim()) {
      setError(t.modal.reasonRequired)
      return
    }
    setSaving(true)
    setError(null)
    try {
      const updated = await dronesApi.updateDrone(drone.id, {
        serialNumber: drone.serialNumber,
        droneModelId: drone.droneModel.id,
        dronePayloadId: drone.dronePayload.id,
        status: selectedStatus,
      })
      onChanged(updated)
    } catch (e) {
      setError(e instanceof Error ? e.message : t.unknownError)
    } finally {
      setSaving(false)
    }
  }

  const canChange = nextStatuses.length > 0

  return (
    <Modal
      title={t.modal.title(
        drone.serialNumber,
        drone.droneModel?.modelCode ?? '',
      )}
      icon="cpu"
      width={440}
      onClose={onClose}
      footer={
        canChange ? (
          <>
            <button
              type="button"
              className="odm-btn odm-btn-gh"
              onClick={onClose}
              disabled={saving}
            >
              {t.modal.cancel}
            </button>
            <button
              type="button"
              className="odm-btn odm-btn-p"
              onClick={handleSave}
              disabled={saving || !selectedStatus}
            >
              {saving ? t.modal.saving : t.modal.confirm}
            </button>
          </>
        ) : (
          <button type="button" className="odm-btn" onClick={onClose}>
            {t.modal.cancel}
          </button>
        )
      }
    >
      {!canChange ? (
        <p className="mng-cell-sub">
          {t.modal.cannotChange(getDroneStatusLabel(drone.status, lang))}
        </p>
      ) : (
        <>
          <FormField id="drone-new-status" label={t.modal.newStatus}>
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
          <FormField
            id="drone-reason"
            label={t.modal.reason}
            required
            error={error ?? undefined}
          >
            <textarea
              id="drone-reason"
              className="odm-inp"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t.modal.reasonPlaceholder}
            />
          </FormField>
        </>
      )}
    </Modal>
  )
}
