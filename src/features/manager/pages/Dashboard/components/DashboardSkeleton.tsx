import { Card } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import { dashboardSkeletonMessages } from './DashboardSkeleton.messages'

export function DashboardSkeleton() {
  const { t } = useI18n(dashboardSkeletonMessages)
  return (
    <div aria-busy="true" aria-live="polite">
      <div className="mng-stats">
        {Array.from({ length: 5 }, (_, i) => (
          <div className="ui-stat" key={i}>
            <span
              className="odm-sk mng-dash-sk"
              style={{ height: 14, width: '60%' }}
            />
            <span
              className="odm-sk mng-dash-sk"
              style={{ height: 28, width: '40%', marginTop: 8 }}
            />
          </div>
        ))}
      </div>
      <div className="mng-dash-grid">
        <Card>
          <span className="odm-sk mng-dash-sk" />
        </Card>
        <Card>
          <span className="odm-sk mng-dash-sk" />
        </Card>
      </div>
      <span className="odm-visually-hidden">{t.loading}</span>
    </div>
  )
}
