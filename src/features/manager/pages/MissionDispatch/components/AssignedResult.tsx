import { Card } from '../../../../../shared/components/ui'
import { OrderWorkflowStepper } from '../../../components/common/OrderWorkflowStepper'
import { OrderIcon } from '../../../components/common/OrderIcon'
import { missionStatusLabel } from '../liveDispatchHelpers'
import { managerHref } from '../../../routes'
import type { Mission } from '../../../../mission/types/mission'
import { useI18n } from '../../../../../shared/i18n'
import { assignedResultMessages } from './AssignedResult.messages'

export function AssignedResult({
  current,
  scheduleText,
  assignedDeviceText,
}: {
  current: Mission
  scheduleText: string
  assignedDeviceText: string
}) {
  const { t } = useI18n(assignedResultMessages)
  return (
    <>
      <OrderWorkflowStepper currentStep={8} />
      <Card>
        <div className="odm-dp-result">
          <span className="odm-dp-result-icon" aria-hidden="true">
            <OrderIcon name="check" size={26} />
          </span>
          <h2>{t.assignedTitle}</h2>
          <p className="odm-dp-help">
            {t.assignedBody(
              current.missionCode,
              missionStatusLabel(current.status, t.missionStatuses),
            )}
          </p>
          <dl className="odm-dp-facts">
            <div>
              <dt>{t.scheduleLabel}</dt>
              <dd>{scheduleText}</dd>
            </div>
            <div>
              <dt>{t.assignedDevice}</dt>
              <dd>{assignedDeviceText}</dd>
            </div>
          </dl>
          <div className="odm-dp-result-actions">
            <a className="odm-btn" href={managerHref({ screen: 'orderQueue' })}>
              {t.backToOrders}
            </a>
            <a
              className="odm-btn odm-btn-p"
              href={managerHref({
                screen: 'missions',
                missionId: current.id,
              })}
            >
              {t.viewMission}
              <OrderIcon name="chevron-right" size={16} />
            </a>
          </div>
        </div>
      </Card>
    </>
  )
}
