import { OrderIcon } from '../../../components/common/OrderIcon'
import { missionStatusLabel } from '../liveDispatchHelpers'
import type { Mission } from '../../../../mission/types/mission'
import { Card, StatusBadge } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import { missionImplementationStepMessages } from './MissionImplementationStep.messages'

export function MissionImplementationStep({
  current,
  scheduleText,
}: {
  current: Mission
  scheduleText: string
}) {
  const { t } = useI18n(missionImplementationStepMessages)
  return (
    <Card title={t.missionImplementation}>
      <dl className="odm-or-summary-list">
        <div>
          <dt>
            <OrderIcon name="tag" size={16} />
            {t.missionHeader(current.missionCode)}
          </dt>
          <dd>{current.missionCode}</dd>
        </div>
        <div>
          <dt>
            <OrderIcon name="info" size={16} />
            {t.status}
          </dt>
          <dd>
            <StatusBadge tone="info">
              {missionStatusLabel(current.status, t.missionStatuses)}
            </StatusBadge>
          </dd>
        </div>
        <div>
          <dt>
            <OrderIcon name="calendar" size={16} />
            {t.actualSchedule}
          </dt>
          <dd>{scheduleText}</dd>
        </div>
      </dl>
    </Card>
  )
}
