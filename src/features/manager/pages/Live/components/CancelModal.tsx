import type { MissionCalendarItem } from '../../../types/missions'
import { useI18n } from '../../../../../shared/i18n'
import { useState } from 'react'
import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import { planningApi } from '../../../api/planningApi'
import { missionsApi } from '../../../api/missionsApi'
import { planningError } from '../../../lib/planningErrors'
import { cancelModalMessages } from './CancelModal.messages'
import { CancelStepOne } from './CancelStepOne'
import { CancelStepTwo } from './CancelStepTwo'

export function CancelModal({
  mission,
  onClose,
  onCancelled,
}: {
  mission: MissionCalendarItem
  onClose: () => void
  onCancelled: () => void
}) {
  const { t } = useI18n(cancelModalMessages)
  const [step, setStep] = useState<1 | 2>(1)
  const [reason, setReason] = useState('')
  const [confirmCode, setConfirmCode] = useState('')
  const planQuery = useApiQuery(
    (signal) => planningApi.getExecutionPlan(mission.orderId, signal),
    [mission.orderId],
  )
  const capabilities = useApiQuery(
    (signal) => planningApi.getSafeStop(mission.id, signal),
    [mission.id],
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (
      capabilities.loading ||
      capabilities.error ||
      capabilities.data?.canCancelMission !== true
    ) {
      setError(t.missionChuaDuDieuKien)
      return
    }
    if (!planQuery.data || planQuery.loading || planQuery.error) {
      setError(t.thePlanMustBeReloaded)
      return
    }
    if (!reason.trim()) {
      setError(t.cancelModal.reasonRequired)
      return
    }
    if (confirmCode !== mission.missionCode) {
      setError(t.cancelModal.codeMismatch(mission.missionCode))
      return
    }
    setSaving(true)
    setError(null)
    try {
      await missionsApi.cancelMission(mission.id, {
        reason,
        expectedPlanRevision: planQuery.data.revision,
      })
      onCancelled()
    } catch (err) {
      setError(planningError(err))
      planQuery.reload()
      capabilities.reload()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t.cancelModal.ariaLabel}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
    >
      <form
        onSubmit={handleConfirm}
        style={{
          background: 'var(--sf)',
          borderRadius: 10,
          padding: 24,
          width: 400,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        {step === 1 ? (
          <CancelStepOne
            mission={mission}
            reason={reason}
            setReason={setReason}
            onClose={onClose}
            setError={setError}
            setStep={setStep}
          />
        ) : (
          <CancelStepTwo
            mission={mission}
            confirmCode={confirmCode}
            setConfirmCode={setConfirmCode}
            error={error}
            setStep={setStep}
            saving={saving}
            capabilities={capabilities}
          />
        )}
      </form>
    </div>
  )
}
