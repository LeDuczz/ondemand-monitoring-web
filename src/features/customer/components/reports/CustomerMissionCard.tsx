import { useI18n } from '../../../../shared/i18n'
import type { CustomerMissionSummary } from '../../api/customerMissionReportApi'
import { customerHref } from '../../routes'
import { customerReportMessages } from './messages'

export function CustomerMissionCard({
  mission,
  siblings = [],
  showLink = true,
}: {
  mission: CustomerMissionSummary
  siblings?: CustomerMissionSummary[]
  showLink?: boolean
}) {
  const { t, locale } = useI18n(customerReportMessages)
  const state = mission.status
  const category =
    state === 'COMPLETED'
      ? 'completed'
      : state === 'CANCELLED'
        ? 'cancelled'
        : ['FAILED', 'FAILED_PREFLIGHT'].includes(state)
          ? 'failed'
          : [
                'PENDING_REVIEW',
                'PENDING_APPROVAL',
                'POSTFLIGHT_CHECKING',
              ].includes(state)
            ? 'review'
            : ['IN_FLIGHT', 'IN_PROGRESS', 'RETURNING'].includes(state)
              ? 'active'
              : state === 'SCHEDULED'
                ? 'scheduled'
                : 'waiting'
  const original = siblings.find(
    (m) => m.missionId === mission.replacesMissionId,
  )
  const replacements = siblings.filter(
    (m) => m.replacesMissionId === mission.missionId,
  )
  const link = (m: CustomerMissionSummary) =>
    customerHref({
      screen: 'missionReport',
      orderId: m.orderId,
      missionId: m.missionId,
    })
  return (
    <article className="cr-mission" aria-label={mission.missionCode}>
      <div className="cr-heading">
        <h3>{mission.missionCode}</h3>
        <span className={`cr-status cr-status--${category}`}>
          {t.statuses[category]}
        </span>
      </div>
      {mission.scopeLabel && (
        <p>
          {t.scope}: {mission.scopeLabel}
        </p>
      )}
      <p>
        {t.schedule}:{' '}
        {mission.scheduledStartAt
          ? new Date(mission.scheduledStartAt).toLocaleString(locale)
          : t.unscheduled}
        {mission.scheduledEndAt && (
          <> → {new Date(mission.scheduledEndAt).toLocaleString(locale)}</>
        )}
      </p>
      {original && (
        <p>
          {t.replaces} <a href={link(original)}>{original.missionCode}</a>.{' '}
          {t.independent}
        </p>
      )}
      {replacements.map((m) => (
        <p key={m.missionId}>
          {t.replacedBy} <a href={link(m)}>{m.missionCode}</a>
        </p>
      ))}
      {showLink && !mission.reportAvailable && <p>{t.unavailable}</p>}
      {showLink && (
        <a
          className="odm-btn odm-btn-gh"
          href={link(mission)}
          aria-label={`${mission.reportAvailable ? t.view : t.details} ${mission.missionCode}`}
        >
          {mission.reportAvailable ? t.view : t.details}
        </a>
      )}
    </article>
  )
}
