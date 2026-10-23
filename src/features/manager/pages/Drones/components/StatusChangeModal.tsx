import type { DeviceResponse } from '../../../types/drones'
import { useI18n } from '../../../../../shared/i18n'
import { dronesPageMessages } from '../DronesPage.messages'
import { MANUAL_TRANSITIONS } from '../droneHelpers'
import { useState } from 'react'
import type { DroneStatus } from '../../../../../shared/types/domain'
import { dronesApi } from '../../../api/dronesApi'
import { getDroneStatusLabel } from '../../../../../shared/lib/statusTone'
import { Button, useToast } from '../../../../../shared/components/ui'
import { managerFeedbackMessages } from '../../../feedback.messages'

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
        style={{ padding: 24, minWidth: 360, maxWidth: 440 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>
          {t.modal.title(drone.serialNumber, drone.deviceModel?.modelName ?? '')}
        </h3>

        {nextStatuses.length === 0 ? (
          <div style={{ color: 'var(--tx3)', fontSize: 13 }}>
            {t.modal.cannotChange(getDroneStatusLabel(drone.status, lang))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label
                htmlFor="drone-new-status"
                style={{
                  fontSize: 12,
                  color: 'var(--tx2)',
                  display: 'block',
                  marginBottom: 4,
                }}
              >
                {t.modal.newStatus}
              </label>
              <select
                id="drone-new-status"
                className="odm-input"
                value={selectedStatus}
                onChange={(e) =>
                  setSelectedStatus(e.target.value as DroneStatus)
                }
                style={{ width: '100%' }}
              >
                {nextStatuses.map((s) => (
                  <option key={s} value={s}>
                    {getDroneStatusLabel(s, lang)}
                  </option>
                ))}
              </select>
            </div>


            {error && (
              <div style={{ color: 'var(--red-fg)', fontSize: 13 }}>
                {error}
              </div>
            )}

            <div
              style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}
            >
              <Button
                type="button"
                onClick={onClose}
                disabled={saving}
              >
                {t.modal.cancel}
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleSave}
                disabled={saving || !selectedStatus}
              >
                {saving ? t.modal.saving : t.modal.confirm}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
