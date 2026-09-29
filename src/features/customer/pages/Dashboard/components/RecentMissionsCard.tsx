import { Card, StatusBadge, toUiTone } from '../../../../../shared/components/ui'
import { useI18n, useLanguage } from '../../../../../shared/i18n'
import type { CustomerMissionHistory } from '../../../api/customerMissionHistoryApi'
import { fmtDateTime, getMissionStatusMeta } from '../../../lib/orderStatus'
import { customerHref } from '../../../routes'
import { recentMissionsMessages } from './RecentMissionsCard.messages'

type Props = {
  missions: CustomerMissionHistory[] | undefined
  loading: boolean
  error: unknown
  onRetry: () => void
}

/** Latest entries of `GET /api/customer/mission-history`; fails independently of the orders. */
export function RecentMissionsCard({ missions, loading, error, onRetry }: Props) {
  const { t, locale } = useI18n(recentMissionsMessages)
  const { lang } = useLanguage()

  let body
  if (loading && !missions) {
    body = <p className="dash-hint">{t.loading}</p>
  } else if (error !== undefined || !missions) {
    body = (
      <div className="dash-error" role="alert">
        <span>{t.errorTitle}</span>
        <button type="button" className="odm-btn odm-btn-gh odm-btn-sm" onClick={onRetry}>
          {t.retry}
        </button>
      </div>
    )
  } else if (missions.length === 0) {
    body = <p className="dash-hint">{t.empty}</p>
  } else {
    body = (
      <ul className="dash-list">
        {missions.map((mission) => {
          const meta = getMissionStatusMeta(mission.status, lang)
          const at = mission.completedAt ?? mission.startedAt ?? mission.scheduledStartAt
          return (
            <li key={mission.id}>
              <div className="dash-list-main">
                <a
                  className="dash-list-title"
                  href={customerHref({ screen: 'missionHistoryDetail', missionId: mission.id })}
                >
                  {mission.orderTitle}
                </a>
                <div className="dash-list-sub">
                  {[mission.missionCode, at ? fmtDateTime(at, locale) : null]
                    .filter(Boolean)
                    .join(' · ')}
                </div>
              </div>
              <StatusBadge tone={toUiTone(meta.tone)}>{meta.label}</StatusBadge>
            </li>
          )
        })}
      </ul>
    )
  }

  return (
    <Card
      title={t.title}
      actions={<a href={customerHref({ screen: 'missionHistory' })}>{t.viewAll}</a>}
    >
      {body}
    </Card>
  )
}
