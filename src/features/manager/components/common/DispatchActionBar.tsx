import { OrderIcon } from './OrderIcon'
import { liveDispatchPageMessages } from './LiveDispatchPage.messages'
import { useI18n } from '../../../../shared/i18n'
import type { DispatchStep, OrderDispatchContext } from './liveDispatchTypes'
import type { AvailableDrone } from '../../../staff/api/droneApi'
import { Button } from '../../../../shared/components/ui'

export function DispatchActionBar({
  stepHint,
  activeStep,
  missingRoleNames,
  activeStepIndex,
  goPrevious,
  missingRoles,
  selectedDrones,
  goNext,
  busy,
  droneIds,
  hasAllRoles,
  orderContext,
  assign,
}: {
  stepHint: Record<DispatchStep, string>
  activeStep: DispatchStep
  missingRoleNames: string[]
  activeStepIndex: number
  goPrevious: () => void
  missingRoles: number
  selectedDrones: AvailableDrone[]
  goNext: () => void
  busy: boolean
  droneIds: string[]
  hasAllRoles: boolean
  orderContext: OrderDispatchContext | undefined
  assign: () => Promise<void>
}) {
  const { t } = useI18n(liveDispatchPageMessages)
  return (
    <div className="odm-or-actionbar">
      <div className="odm-or-actionbar-hint">
        <span className="odm-or-actionbar-hint-icon">
          <OrderIcon name="info" size={18} />
        </span>
        <span>{stepHint[activeStep]}</span>
        {activeStep === 'staff' && missingRoleNames.length > 0 && (
          <strong className="odm-or-actionbar-missing">
            Còn thiếu: {missingRoleNames.join(', ')}
          </strong>
        )}
      </div>
      <div className="odm-or-actionbar-actions">
        <Button
          type="button"
          variant="ghost"
          disabled={activeStepIndex === 0}
          onClick={goPrevious}
        >
          {t.previous}
        </Button>
        {activeStep !== 'confirm' ? (
          <Button
            type="button"
            variant="primary"
            className={
              (activeStep === 'staff' && missingRoles > 0) ||
              (activeStep === 'device' && selectedDrones.length === 0)
                ? 'is-blocked'
                : undefined
            }
            onClick={goNext}
          >
            {t.next}
            <OrderIcon name="chevron-right" size={16} />
          </Button>
        ) : (
          <Button
            type="button"
            variant="primary"
            disabled={
              busy ||
              droneIds.length === 0 ||
              !hasAllRoles ||
              (orderContext && !orderContext.canAssign)
            }
            onClick={() => void assign()}
          >
            {busy ? t.assigning : t.assign}
          </Button>
        )}
      </div>
    </div>
  )
}
