import type { ReactNode } from 'react'

import { Card, PageHeader, StatusBadge } from '../../../../shared/components/ui'
import { useI18n } from '../../../../shared/i18n'
import type { MissionStaffRole } from '../../../mission/types/mission'
import { assignmentReadiness } from '../../lib/assignmentReadiness'
import { OrderIcon } from './OrderIcon'
import { OrderWorkflowStepper } from './OrderWorkflowStepper'
import { orderMissionsOverviewMessages } from './OrderMissionsOverview.messages'
import { staffRoleLabel } from './missionDetailHelpers'
import { planningSchedule } from './planningSchedule'

const ROLES: MissionStaffRole[] = [
  'PILOT',
  'OPERATOR',
  'MAINTAINER',
  'INSPECTOR',
]

type OverviewMission = {
  id: string
  missionCode: string
  status: string
  scheduledStartAt?: string | null
  scheduledEndAt?: string | null
  deviceId?: string | null
  droneId?: string | null
  deviceCode?: string | null
  droneCode?: string | null
  deviceName?: string | null
  staffAssignments?: {
    staffId: string
    staffName?: string | null
    staffEmail?: string | null
    assignedRole: MissionStaffRole
    responseStatus?: string
  }[]
}

/** Step 8: read-only summary of every Mission of the Order so the manager can double-check. */
export function OrderMissionsOverview({
  missions,
  scopeLabels,
  loading,
  onDone,
  onReload,
  onAssignMore,
  doneLabel,
  embedded = false,
}: {
  missions: OverviewMission[]
  scopeLabels: Record<string, string | undefined>
  loading: boolean
  onDone: () => void
  onReload: () => void
  onAssignMore?: (missionId: string) => void
  doneLabel: ReactNode
  /** The outer page already renders the heading and stepper. */
  embedded?: boolean
}) {
  const { t, lang, locale } = useI18n(orderMissionsOverviewMessages)
  const effective = missions.filter((mission) => mission.status !== 'CANCELLED')
  const completeCount = effective.filter(
    (mission) => assignmentReadiness(mission).complete,
  ).length
  const allReady = effective.length > 0 && completeCount === effective.length

  return (
    <div className="odm-or">
      {!embedded && (
        <>
          <PageHeader
            title={t.title}
            subtitle={t.subtitle}
            actions={
              <button
                type="button"
                className="odm-btn"
                disabled={loading}
                onClick={onReload}
              >
                {t.reload}
              </button>
            }
          />
          <OrderWorkflowStepper currentStep={8} />
        </>
      )}
      <Card
        title={t.assignedCount(completeCount, effective.length)}
        actions={
          <span role="status">
            <StatusBadge tone={allReady ? 'success' : 'warning'}>
              {allReady ? t.ready : t.incomplete}
            </StatusBadge>
          </span>
        }
      >
        {loading && <p role="status">{t.loading}</p>}
        <div className="odm-or-overview-grid" aria-label={t.ariaLabel}>
          {missions.map((mission) => {
            const readiness = assignmentReadiness(mission)
            const cancelled = mission.status === 'CANCELLED'
            const device =
              mission.deviceCode ||
              mission.droneCode ||
              mission.deviceName ||
              (mission.deviceId || mission.droneId ? t.deviceAssigned : null)
            return (
              <article
                key={mission.id}
                className={`odm-or-overview-card${
                  cancelled ? ' is-cancelled' : ''
                }`}
              >
                <header>
                  <strong>{mission.missionCode}</strong>
                  <StatusBadge
                    tone={readiness.complete ? 'success' : 'warning'}
                  >
                    {cancelled
                      ? t.cancelled
                      : readiness.complete
                        ? t.assigned
                        : (readiness.label ?? mission.status)}
                  </StatusBadge>
                </header>
                {scopeLabels[mission.id] ? (
                  <p className="odm-or-muted">{scopeLabels[mission.id]}</p>
                ) : null}
                <dl className="odm-or-overview-list">
                  <div>
                    <dt>
                      <OrderIcon name="calendar" size={16} />
                      {t.schedule}
                    </dt>
                    <dd>
                      {planningSchedule(
                        mission.scheduledStartAt,
                        mission.scheduledEndAt,
                        locale,
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>
                      <OrderIcon name="drone" size={16} />
                      {t.device}
                    </dt>
                    <dd>{device ?? '—'}</dd>
                  </div>
                  {ROLES.map((role) => {
                    const names = [
                      ...new Set(
                        (mission.staffAssignments ?? [])
                          .filter(
                            (person) =>
                              person.assignedRole === role &&
                              person.responseStatus !== 'REJECTED',
                          )
                          .map(
                            (person) =>
                              person.staffName ||
                              person.staffEmail ||
                              person.staffId,
                          ),
                      ),
                    ]
                    return (
                      <div key={role}>
                        <dt>
                          <OrderIcon name="user" size={16} />
                          {staffRoleLabel(role, lang)}
                        </dt>
                        <dd>{names.join(', ') || '—'}</dd>
                      </div>
                    )
                  })}
                </dl>
                {!cancelled && !readiness.complete && onAssignMore ? (
                  <button
                    type="button"
                    className="odm-btn"
                    onClick={() => onAssignMore(mission.id)}
                  >
                    {t.assignMore}
                  </button>
                ) : null}
              </article>
            )
          })}
        </div>
      </Card>
      <div className="odm-or-actionbar">
        <div className="odm-or-actionbar-hint">
          {allReady ? t.hintAllReady : t.hintIncomplete}
        </div>
        <button type="button" className="odm-btn odm-btn-p" onClick={onDone}>
          {doneLabel}
        </button>
      </div>
    </div>
  )
}
