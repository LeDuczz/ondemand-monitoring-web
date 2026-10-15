import { Card } from '../../../../../shared/components/ui'
import { OrderIcon } from '../../../components/common/OrderIcon'
import type { Mission } from '../../../../mission/types/mission'
import type { MissionStaffRole } from '../../../../mission/types/mission'
import type { AvailableDrone } from '../../../../staff/api/droneApi'
import { useI18n } from '../../../../../shared/i18n'
import { dispatchSidebarMessages } from './DispatchSidebar.messages'

/** Mission summary and the current resource selection. */
export function DispatchSidebar({
  current,
  scheduleText,
  roleSummary,
  selectedDrones,
  missingRoles,
}: {
  current: Mission
  scheduleText: string
  roleSummary: { role: MissionStaffRole; names: string[] }[]
  selectedDrones: AvailableDrone[]
  missingRoles: number
}) {
  const { t } = useI18n(dispatchSidebarMessages)
  const none = <dd className="is-empty">{t.notSelected}</dd>
  return (
    <>
      <Card title={t.summaryTitle}>
        <dl className="odm-dp-facts">
          <div>
            <dt>{t.mission}</dt>
            <dd className="odm-mono">{current.missionCode}</dd>
          </div>
          <div>
            <dt>{t.order}</dt>
            <dd>{current.orderTitle ?? '—'}</dd>
          </div>
          <div>
            <dt>{t.customer}</dt>
            <dd>{current.customerName ?? '—'}</dd>
          </div>
          <div>
            <dt>{t.schedule}</dt>
            <dd>{scheduleText}</dd>
          </div>
        </dl>
      </Card>
      <Card title={t.selectionTitle}>
        <dl className="odm-dp-facts">
          {roleSummary.map((item) => (
            <div key={item.role}>
              <dt>{t.roles[item.role]}</dt>
              {item.names.length > 0 ? <dd>{item.names.join(', ')}</dd> : none}
            </div>
          ))}
          <div>
            <dt>{t.devices}</dt>
            {selectedDrones.length > 0 ? (
              <dd>{selectedDrones.map((drone) => drone.label).join(', ')}</dd>
            ) : (
              none
            )}
          </div>
        </dl>
        <ul className="odm-dp-checks">
          <li className={missingRoles === 0 ? 'is-ok' : 'is-bad'}>
            <OrderIcon
              name={missingRoles === 0 ? 'check' : 'alert'}
              size={16}
            />
            {missingRoles === 0
              ? t.rolesComplete
              : t.rolesMissing(missingRoles)}
          </li>
          <li className={selectedDrones.length > 0 ? 'is-ok' : 'is-bad'}>
            <OrderIcon
              name={selectedDrones.length > 0 ? 'check' : 'alert'}
              size={16}
            />
            {selectedDrones.length > 0
              ? t.deviceSelectedCount(selectedDrones.length)
              : t.deviceMissing}
          </li>
        </ul>
      </Card>
    </>
  )
}
