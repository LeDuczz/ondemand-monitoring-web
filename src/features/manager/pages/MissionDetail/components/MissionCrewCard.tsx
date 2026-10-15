import { Card, StatusBadge } from '../../../../../shared/components/ui'
import { OrderIcon } from '../../../components/common/OrderIcon'
import {
  initialsOf,
  staffRoleLabel,
  assignmentUiTone,
  staffResponseLabel,
} from '../../../components/common/missionDetailHelpers'
import type { MissionStaffAssignmentResponse } from '../../../types/missions'
import { useI18n } from '../../../../../shared/i18n'
import { missionCrewCardMessages } from './MissionCrewCard.messages'

/** Drone and crew assignments with their acceptance state. */
export function MissionCrewCard({
  staff,
  accepted,
  deviceCode,
  deviceLabel,
}: {
  staff: MissionStaffAssignmentResponse[]
  accepted: number
  deviceCode: string | null
  deviceLabel: string
}) {
  const { t, lang } = useI18n(missionCrewCardMessages)
  return (
    <Card
      title={t.crewCard}
      actions={
        staff.length > 0 ? (
          <span className="odm-md-count">
            {t.crewAccepted(accepted, staff.length)}
          </span>
        ) : undefined
      }
    >
      {staff.length > 0 ? (
        <div className="odm-md-progress" aria-hidden="true">
          <span style={{ width: `${(accepted / staff.length) * 100}%` }} />
        </div>
      ) : null}
      {deviceCode || staff.length > 0 ? (
        <ul className="odm-md-crew">
          {deviceCode ? (
            <li>
              <span className="odm-md-avatar is-device" aria-hidden="true">
                <OrderIcon name="drone" size={16} />
              </span>
              <span className="odm-md-crew-main">
                <span className="odm-md-crew-role">{t.crewDevice}</span>
                <strong>{deviceLabel}</strong>
              </span>
              <StatusBadge tone="info">{t.crewReserved}</StatusBadge>
            </li>
          ) : null}
          {staff.map((assignment) => {
            const name =
              assignment.staffName ??
              assignment.staffEmail ??
              assignment.staffId
            return (
              <li key={assignment.id}>
                <span className="odm-md-avatar" aria-hidden="true">
                  {initialsOf(name)}
                </span>
                <span className="odm-md-crew-main">
                  <span className="odm-md-crew-role">
                    {staffRoleLabel(assignment.assignedRole, lang)}
                  </span>
                  <strong>{name}</strong>
                  {assignment.staffEmail && assignment.staffName ? (
                    <small>{assignment.staffEmail}</small>
                  ) : null}
                </span>
                <StatusBadge tone={assignmentUiTone(assignment.responseStatus)}>
                  {staffResponseLabel(assignment.responseStatus, lang)}
                </StatusBadge>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="odm-or-empty">{t.crewEmpty}</p>
      )}
    </Card>
  )
}
