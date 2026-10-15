import { managerHref } from '../../../routes'
import type { MissionCalendarItem } from '../../../types/missions'
import type { Dispatch } from 'react'
import type { SetStateAction } from 'react'
import type { UseApiQueryState } from '../../../../../shared/hooks/useApiQuery'
import type { SafeStop } from '../../../types/planning'
import { useI18n } from '../../../../../shared/i18n'
import { cancelStepTwoMessages } from './CancelStepTwo.messages'

export function CancelStepTwo({
  mission,
  confirmCode,
  setConfirmCode,
  error,
  setStep,
  saving,
  capabilities,
}: {
  mission: MissionCalendarItem
  confirmCode: string
  setConfirmCode: Dispatch<SetStateAction<string>>
  error: string | null
  setStep: Dispatch<SetStateAction<2 | 1>>
  saving: boolean
  capabilities: UseApiQueryState<SafeStop>
}) {
  const { t } = useI18n(cancelStepTwoMessages)
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
        {t.cancelModal.step2Title}
      </h3>
      <p style={{ margin: 0, fontSize: 13, color: 'var(--tx2)' }}>
        {t.cancelModal.step2Body}
      </p>
      <code
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 14,
          background: 'var(--sf3)',
          padding: '4px 10px',
          borderRadius: 5,
          display: 'block',
          textAlign: 'center',
        }}
      >
        {mission.missionCode}
      </code>
      <label style={{ fontSize: 13 }}>
        {t.cancelModal.confirmCodeLabel}
        <input
          type="text"
          className="odm-inp"
          value={confirmCode}
          onChange={(e) => setConfirmCode(e.target.value)}
          placeholder={mission.missionCode}
          style={{ display: 'block', marginTop: 4, width: '100%' }}
          autoFocus
        />
      </label>
      {error && (
        <div
          role="alert"
          style={{
            fontSize: 12,
            color: 'var(--red-fg)',
            background: 'var(--red-bg)',
            borderRadius: 6,
            padding: '6px 10px',
          }}
        >
          {error}
          <a
            href={managerHref({
              screen: 'orderReview',
              orderId: mission.orderId,
            })}
          >
            {t.viewOrderPlan}
          </a>
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button type="button" className="odm-btn" onClick={() => setStep(1)}>
          {t.cancelModal.back}
        </button>
        <button
          type="submit"
          className="odm-btn odm-btn-rd"
          disabled={
            saving ||
            capabilities.loading ||
            Boolean(capabilities.error) ||
            capabilities.data?.canCancelMission !== true
          }
        >
          {saving ? t.cancelModal.cancelling : t.cancelModal.confirmCancel}
        </button>
      </div>
    </>
  )
}
