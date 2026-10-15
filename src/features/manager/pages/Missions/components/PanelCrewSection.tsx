import { formatStaffSummary } from '../missionsHelpers'
import { OrderIcon } from '../../../components/common/OrderIcon'
import {
  initialsOf,
  staffRoleLabel,
  assignmentTone,
  staffResponseLabel,
} from '../../../components/common/missionDetailHelpers'
import type { MissionCalendarItem } from '../../../types/missions'
import type { MissionStaffAssignmentResponse } from '../../../types/missions'
import { useI18n } from '../../../../../shared/i18n'
import { panelCrewSectionMessages } from './PanelCrewSection.messages'

export function PanelCrewSection({
  staffAssignments,
  hasAssignedResources,
  mission,
}: {
  staffAssignments: MissionStaffAssignmentResponse[]
  hasAssignedResources: boolean
  mission: MissionCalendarItem
}) {
  const { t, lang } = useI18n(panelCrewSectionMessages)
  return (
    <section className="odm-or-crew">
      <div className="odm-or-crew-head">
        <span className="odm-or-crew-title">{t.assignments.title}</span>
        {staffAssignments.length > 0 ? (
          <span className="odm-or-crew-count">
            {formatStaffSummary(staffAssignments, t.staffAccepted)}
          </span>
        ) : null}
      </div>
      {staffAssignments.length > 0 ? (
        <div className="odm-or-crew-progress" aria-hidden="true">
          <span
            style={{
              width: `${
                (staffAssignments.filter((i) => i.responseStatus === 'ACCEPTED')
                  .length /
                  staffAssignments.length) *
                100
              }%`,
            }}
          />
        </div>
      ) : null}

      {hasAssignedResources ? (
        <ul className="odm-or-crew-list">
          <li className="odm-or-crew-item">
            <span className="odm-or-crew-avatar is-device">
              <OrderIcon name="drone" size={16} />
            </span>
            <span className="odm-or-crew-main">
              <span className="odm-or-crew-role">{t.assignments.device}</span>
              <strong>
                {mission.droneCode
                  ? `${mission.droneCode}${mission.droneName ? ` ${mission.droneName}` : ''}`
                  : '—'}
              </strong>
            </span>
            {mission.droneCode ? (
              <span className="odm-or-pill odm-or-pill-blue">
                {t.assignments.reserved}
              </span>
            ) : null}
          </li>

          {staffAssignments.map((assignment) => {
            const name =
              assignment.staffName ?? assignment.staffEmail ?? t.assignedStaff
            return (
              <li key={assignment.id} className="odm-or-crew-item">
                <span className="odm-or-crew-avatar" aria-hidden="true">
                  {initialsOf(name)}
                </span>
                <span className="odm-or-crew-main">
                  <span className="odm-or-crew-role">
                    {staffRoleLabel(assignment.assignedRole, lang)}
                  </span>
                  <strong>{name}</strong>
                  {assignment.staffEmail && assignment.staffName ? (
                    <small>{assignment.staffEmail}</small>
                  ) : null}
                </span>
                <span
                  className={`odm-or-pill odm-or-pill-${assignmentTone(
                    assignment.responseStatus,
                  )}`}
                >
                  {staffResponseLabel(assignment.responseStatus, lang)}
                </span>
              </li>
            )
          })}
        </ul>
      ) : (
        <div className="odm-or-empty">{t.assignments.empty}</div>
      )}
    </section>
  )
}
