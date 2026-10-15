import { OrderIcon } from '../../../components/common/OrderIcon'
import {
  initialsOf,
  STAFF_ROLE_LABELS,
  assignmentTone,
  STAFF_RESPONSE_LABELS,
} from '../../../components/common/missionDetailHelpers'
import type { MissionStaffAssignmentResponse } from '../../../types/missions'
import { useI18n } from '../../../../../shared/i18n'
import { missionCrewCardMessages } from './MissionCrewCard.messages'

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
  const { t } = useI18n(missionCrewCardMessages)
  return (
    <section className="odm-or-card">
      <header className="odm-or-card-head">
        <span className="odm-or-card-title">
          <OrderIcon name="users" size={18} />
          {t.crewCard}
        </span>
        {staff.length > 0 ? (
          <span className="odm-or-crew-count">
            {t.crewAccepted(accepted, staff.length)}
          </span>
        ) : null}
      </header>
      <div className="odm-or-card-body">
        {staff.length > 0 ? (
          <div className="odm-or-crew-progress" aria-hidden="true">
            <span style={{ width: `${(accepted / staff.length) * 100}%` }} />
          </div>
        ) : null}
        {deviceCode || staff.length > 0 ? (
          <ul className="odm-or-crew-list">
            {deviceCode ? (
              <li className="odm-or-crew-item">
                <span className="odm-or-crew-avatar is-device">
                  <OrderIcon name="drone" size={16} />
                </span>
                <span className="odm-or-crew-main">
                  <span className="odm-or-crew-role">{t.crewDevice}</span>
                  <strong>{deviceLabel}</strong>
                </span>
                <span className="odm-or-pill odm-or-pill-blue">
                  {t.crewReserved}
                </span>
              </li>
            ) : null}
            {staff.map((assignment) => {
              const name =
                assignment.staffName ??
                assignment.staffEmail ??
                assignment.staffId
              return (
                <li key={assignment.id} className="odm-or-crew-item">
                  <span className="odm-or-crew-avatar" aria-hidden="true">
                    {initialsOf(name)}
                  </span>
                  <span className="odm-or-crew-main">
                    <span className="odm-or-crew-role">
                      {STAFF_ROLE_LABELS[assignment.assignedRole]}
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
                    {STAFF_RESPONSE_LABELS[assignment.responseStatus]}
                  </span>
                </li>
              )
            })}
          </ul>
        ) : (
          <div className="odm-or-empty">{t.crewEmpty}</div>
        )}
      </div>
    </section>
  )
}
