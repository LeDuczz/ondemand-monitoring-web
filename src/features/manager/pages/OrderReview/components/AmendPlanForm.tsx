import type { Dispatch } from 'react'
import type { SetStateAction } from 'react'
import { useI18n } from '../../../../../shared/i18n'
import { amendPlanFormMessages } from './AmendPlanForm.messages'

export function AmendPlanForm({
  amending,
  mutate,
  reason,
  setReason,
  busy,
  setAmending,
}: {
  amending: boolean
  mutate: (
    action: 'finalize' | 'amend' | 'cancel',
    missionId?: string | undefined,
  ) => Promise<void>
  reason: string
  setReason: Dispatch<SetStateAction<string>>
  busy: boolean
  setAmending: Dispatch<SetStateAction<boolean>>
}) {
  const { t } = useI18n(amendPlanFormMessages)

  return (
    <>
      {amending && (
        <form
          className="odm-planning-adjustment"
          onSubmit={(e) => {
            e.preventDefault()
            void mutate('amend')
          }}
        >
          <h3>{t.adjustPlan}</h3>
          <p>{t.moLaiKeHoachDe}</p>
          <label>
            {t.reasonForAdjustingThePlan}
            <textarea
              required
              autoFocus
              maxLength={1000}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </label>
          <button
            className="odm-btn odm-btn-p"
            disabled={busy || !reason.trim()}
          >
            {t.confirmAdjustment}
          </button>
          <button
            type="button"
            className="odm-btn"
            onClick={() => setAmending(false)}
          >
            {t.close}
          </button>
        </form>
      )}
    </>
  )
}
