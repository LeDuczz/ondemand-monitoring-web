import { formatDateTime } from '../../../lib/formatVnDateTime'
import { useI18n } from '../../../../../shared/i18n'
import { dashboardHeaderMessages } from './DashboardHeader.messages'

export function DashboardHeader({ now }: { now: Date }) {
  const { t, lang } = useI18n(dashboardHeaderMessages)
  return (
    <div className="odm-mgr-dash-head">
      <div>
        <h1 className="odm-mgr-dash-title">{t.title}</h1>
        <div className="odm-mgr-dash-date">{formatDateTime(now, lang)}</div>
      </div>
    </div>
  )
}
