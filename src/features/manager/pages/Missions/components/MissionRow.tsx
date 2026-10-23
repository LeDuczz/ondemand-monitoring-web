import { managerHref } from '../../../routes'
import { formatOrderCode } from '../../../components/common/format'
import {
  formatScheduled,
  formatStaffSummary,
  deliveryTone,
  deliveryLabel,
} from '../missionsHelpers'
import { missionStopLabel } from '../../../../mission/lib/missionOperationalState'
import { StatusBadge } from '../../../../../shared/components/odm/StatusBadge'
import { missionStatusTone } from '../../../../../shared/lib/statusTone'
import { assignmentReadiness } from '../../../lib/assignmentReadiness'
import { missionsPageMessages } from '../MissionsPage.messages'
import { useI18n } from '../../../../../shared/i18n'
import type { MissionCalendarItem } from '../../../types/missions'
import type { Dispatch, SetStateAction } from 'react'
import type { DeliveryStatus } from '../missionsTypes'
import { Button } from '../../../../../shared/components/ui'

export function MissionRow({
  selectedMission,
  m,
  setSelectedMission,
  deliveryStatuses,
  orderDeliveryStatuses,
}: {
  selectedMission: string | null
  m: MissionCalendarItem
  setSelectedMission: Dispatch<SetStateAction<string | null>>
  deliveryStatuses: Record<string, DeliveryStatus>
  orderDeliveryStatuses: Record<string, DeliveryStatus>
}) {
  const { t, locale } = useI18n(missionsPageMessages)
  return (
    <tr
      className={`is-clickable${selectedMission === m.id ? ' is-selected' : ''}`}
      onClick={() => setSelectedMission(selectedMission === m.id ? null : m.id)}
    >
      <td>
        <div className="mgr-cell-main odm-mono">{m.missionCode}</div>
        <div className="mgr-cell-sub">
          <a
            href={managerHref({
              screen: 'orderReview',
              orderId: m.orderId,
            })}
            onClick={(event) => event.stopPropagation()}
            aria-label={t.openOrderPlanOf(m.missionCode)}
          >
            {m.orderCode ? formatOrderCode(m.orderCode) : t.openOrderPlan}
          </a>
        </div>
      </td>
      <td className="mgr-nowrap">
        {formatScheduled(m.scheduledStartAt, m.scheduledEndAt, locale)}
      </td>
      <td>
        {m.droneCode
          ? `${m.droneCode}${m.droneName ? ` ${m.droneName}` : ''}`
          : '—'}
      </td>
      <td>{formatStaffSummary(m.staffAssignments)}</td>
      <td>
        {missionStopLabel(m) ? (
          <StatusBadge tone="yellow">{missionStopLabel(m)}</StatusBadge>
        ) : (
          <StatusBadge
            kind="mission"
            status={m.status}
            tone={missionStatusTone[m.status]}
          />
        )}
        {assignmentReadiness(m).label && (
          <small className="mgr-cell-sub">{assignmentReadiness(m).label}</small>
        )}
      </td>
      <td>
        <StatusBadge tone={deliveryTone(deliveryStatuses[m.id] ?? 'NOT_READY')}>
          {deliveryLabel(deliveryStatuses[m.id] ?? 'NOT_READY', t)}
        </StatusBadge>
        {orderDeliveryStatuses[m.orderId] && (
          <small className="mgr-cell-sub">
            {deliveryLabel(orderDeliveryStatuses[m.orderId], t)}
          </small>
        )}
      </td>
      <td className="is-right">
        <Button
          size="sm"
          href={managerHref({
            screen: 'missionDetail',
            missionId: m.id,
          })}
          onClick={(event) => event.stopPropagation()}
        >
          {t.view}
        </Button>
        {assignmentReadiness(m).needsSetup && (
          <Button
            variant="primary"
            size="sm"
            href={managerHref({
              screen: 'missionSetup',
              missionId: m.id,
            })}
            onClick={(event) => event.stopPropagation()}
          >
            {t.continueSetup}
          </Button>
        )}
      </td>
    </tr>
  )
}
