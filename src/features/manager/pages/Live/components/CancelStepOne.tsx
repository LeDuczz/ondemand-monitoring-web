import type { MissionCalendarItem } from '../../../types/missions'
import type { Dispatch } from 'react'
import type { SetStateAction } from 'react'
import { useI18n } from '../../../../../shared/i18n'
import { cancelStepOneMessages } from './CancelStepOne.messages'

export function CancelStepOne({
  mission,
  reason,
  setReason,
  onClose,
  setError,
  setStep,
}: {
  mission: MissionCalendarItem
  reason: string
  setReason: Dispatch<SetStateAction<string>>
  onClose: () => void
  setError: Dispatch<SetStateAction<string | null>>
  setStep: Dispatch<SetStateAction<2 | 1>>
}) {
  const { t } = useI18n(cancelStepOneMessages)
  return (
    <>
      <h3
        style={{
          margin: 0,
          fontSize: 16,
          fontWeight: 600,
          color: 'var(--red-fg)',
        }}
      >
        {t.cancelModal.step1Title}
      </h3>
      <p style={{ margin: 0, fontSize: 13, color: 'var(--tx2)' }}>
        {t.mission}{' '}
        <strong style={{ fontFamily: 'var(--font-mono)' }}>
          {mission.missionCode}
        </strong>{' '}
        {t.cancelModal.step1Body}
      </p>
      <label style={{ fontSize: 13 }}>
        {t.cancelModal.reasonLabel}
        <textarea
          className="odm-inp"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          style={{ display: 'block', marginTop: 4, width: '100%' }}
          placeholder={t.cancelModal.reasonPlaceholder}
          autoFocus
        />
      </label>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button type="button" className="odm-btn" onClick={onClose}>
          {t.cancelModal.close}
        </button>
        <button
          type="button"
          className="odm-btn odm-btn-rd"
          disabled={!reason.trim()}
          onClick={() => {
            setError(null)
            setStep(2)
          }}
        >
          {t.cancelModal.continue}
        </button>
      </div>
    </>
  )
}
