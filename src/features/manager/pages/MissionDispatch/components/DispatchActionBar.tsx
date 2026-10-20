import { Card } from '../../../../../shared/components/ui'
import { OrderIcon } from '../../../components/common/OrderIcon'
import type { DispatchStep } from '../liveDispatchHelpers'
import type { OrderDispatchContext } from '../orderDispatchContext'
import { useI18n } from '../../../../../shared/i18n'
import { dispatchActionBarMessages } from './DispatchActionBar.messages'

/** Sidebar card with the step hint and the back / next / assign buttons. */
export function DispatchActionBar({
  stepHint,
  missingRoleNames,
  nextBlocked,
  activeStep,
  activeStepIndex,
  goPrevious,
  goNext,
  busy,
  droneIds,
  hasAllRoles,
  orderContext,
  assign,
}: {
  stepHint: Record<DispatchStep, string>
  /** Staff roles still empty, listed next to the hint on the staff step. */
  missingRoleNames: string[]
  /** The step is not complete yet: the Next button stays clickable (it explains why) but looks inactive. */
  nextBlocked: boolean
  activeStep: DispatchStep
  activeStepIndex: number
  goPrevious: () => void
  goNext: () => void
  busy: boolean
  droneIds: string[]
  hasAllRoles: boolean
  orderContext: OrderDispatchContext | undefined
  assign: () => Promise<void>
}) {
  const { t } = useI18n(dispatchActionBarMessages)
  return (
    <Card>
      <div className="odm-dp-actions">
        <p className="odm-dp-actions-hint">
          {stepHint[activeStep]}
          {activeStep === 'staff' && missingRoleNames.length > 0 && (
            <strong className="odm-or-actionbar-missing">
              {t.missingPrefix} {missingRoleNames.join(', ')}
            </strong>
          )}
        </p>
        <div className="odm-dp-actions-row">
          <button
            type="button"
            className="odm-btn"
            disabled={activeStepIndex === 0}
            onClick={goPrevious}
          >
            {t.previous}
          </button>
          {activeStep !== 'confirm' ? (
            <button
              type="button"
              className={`odm-btn odm-btn-p${nextBlocked ? ' is-blocked' : ''}`}
              onClick={goNext}
            >
              {t.next}
              <OrderIcon name="chevron-right" size={16} />
            </button>
          ) : (
            <button
              type="button"
              className="odm-btn odm-btn-p"
              disabled={
                busy ||
                droneIds.length === 0 ||
                !hasAllRoles ||
                (orderContext && !orderContext.canAssign)
              }
              onClick={() => void assign()}
            >
              {busy ? t.assigning : t.assign}
            </button>
          )}
        </div>
      </div>
    </Card>
  )
}
