import { OrderIcon } from '../../../components/common/OrderIcon'
import { missionStatusLabel } from '../liveDispatchHelpers'
import type { Mission } from '../../../../mission/types/mission'
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
    <section className="odm-or-card">
      <header className="odm-or-card-head">
        <span className="odm-or-card-title">
          <OrderIcon name="service" size={18} />
          {t.missionImplementation}
        </span>
      </header>
      <dl className="odm-or-card-body odm-or-summary-list">
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
            <span className="odm-or-pill odm-or-pill-blue">
              {missionStatusLabel(current.status, t.missionStatuses)}
            </span>
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
    </section>
  )
}
