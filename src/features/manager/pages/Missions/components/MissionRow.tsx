import type { Dispatch, SetStateAction } from 'react'
import { managerHref } from '../../../routes'
import { formatOrderCode } from '../../../components/common/format'
import {
  formatScheduled,
  formatStaffSummary,
  deliveryTone,
  deliveryLabel,
  type DeliveryStatus,
} from '../missionsHelpers'
import { missionStopLabel } from '../../../../mission/lib/missionOperationalState'
import {
  StatusBadge,
  toUiTone,
} from '../../../../../shared/components/ui'
import {
  getMissionStatusLabel,
  missionStatusTone,
} from '../../../../../shared/lib/statusTone'
import { assignmentReadiness } from '../../../lib/assignmentReadiness'
import type { MissionCalendarItem } from '../../../types/missions'
import { useI18n } from '../../../../../shared/i18n'
import { missionRowMessages } from './MissionRow.messages'

export function MissionRow({
  m,
  selectedMission,
  setSelectedMission,
  deliveryStatuses,
  orderDeliveryStatuses,
}: {
  m: MissionCalendarItem
  selectedMission: string | null
  setSelectedMission: Dispatch<SetStateAction<string | null>>
  deliveryStatuses: Record<string, DeliveryStatus>
  orderDeliveryStatuses: Record<string, DeliveryStatus>
}) {
  const { t, lang, locale } = useI18n(missionRowMessages)
  const stopLabel = missionStopLabel(m)
  const readiness = assignmentReadiness(m)
  const delivery = deliveryStatuses[m.id] ?? 'NOT_READY'
  const orderDelivery = orderDeliveryStatuses[m.orderId]
  return (
    <tr
      className={selectedMission === m.id ? 'is-selected' : undefined}
      onClick={() => setSelectedMission(selectedMission === m.id ? null : m.id)}
    >
      <td>
        <div className="mng-cell-main odm-mono">{m.missionCode}</div>
        <div className="mng-cell-sub">
          <a
            href={managerHref({ screen: 'orderReview', orderId: m.orderId })}
            onClick={(event) => event.stopPropagation()}
            aria-label={t.openTheOrderPlanOf(m.missionCode)}
          >
            {m.orderCode ? formatOrderCode(m.orderCode) : t.openOrderPlan}
          </a>
          {m.attemptNumber != null && ` · ${t.attempt(m.attemptNumber)}`}
        </div>
      </td>
      <td className="mng-nowrap">
        {formatScheduled(m.scheduledStartAt, m.scheduledEndAt, locale)}
      </td>
      <td>
        {m.droneCode
          ? `${m.droneCode}${m.droneName ? ` ${m.droneName}` : ''}`
          : '—'}
      </td>
      <td className="mng-nowrap">
        {formatStaffSummary(m.staffAssignments, t.staffAccepted)}
      </td>
      <td>
        {stopLabel ? (
          <StatusBadge tone="warning">{stopLabel}</StatusBadge>
        ) : (
          <StatusBadge tone={toUiTone(missionStatusTone[m.status])}>
            {getMissionStatusLabel(m.status, lang)}
          </StatusBadge>
        )}
        {readiness.label && (
          <div className="mng-cell-sub">{readiness.label}</div>
        )}
      </td>
      <td>
        <StatusBadge tone={deliveryTone(delivery)}>
          {deliveryLabel(delivery, t)}
        </StatusBadge>
        {orderDelivery && (
          <div className="mng-cell-sub">{deliveryLabel(orderDelivery, t)}</div>
        )}
      </td>
      <td className="mng-actions">
        <a
          className="odm-btn odm-btn-sm"
          href={managerHref({ screen: 'missionDetail', missionId: m.id })}
          onClick={(event) => event.stopPropagation()}
        >
          {t.view}
        </a>
        {readiness.needsSetup && (
          <a
            className="odm-btn odm-btn-sm odm-btn-p"
            href={managerHref({ screen: 'missionSetup', missionId: m.id })}
            onClick={(event) => event.stopPropagation()}
          >
            {t.continueSetup}
          </a>
        )}
      </td>
    </tr>
  )
}
