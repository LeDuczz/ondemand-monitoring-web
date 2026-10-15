import { useI18n } from '../../../../../shared/i18n'
import { dashboardSkeletonMessages } from './DashboardSkeleton.messages'

export function DashboardSkeleton() {
  const { t } = useI18n(dashboardSkeletonMessages)
  return (
    <div className="odm-mgr-dash" aria-busy="true" aria-live="polite">
      <div className="odm-mgr-kpi-row">
        {Array.from({ length: 5 }, (_, i) => (
          <div className="odm-card odm-mgr-kpi-sk" key={i}>
            <span className="odm-sk" style={{ width: '60%', height: 12 }} />
            <span className="odm-sk" style={{ width: '40%', height: 24 }} />
          </div>
        ))}
      </div>
      <div className="odm-mgr-charts-row">
        <div className="odm-card odm-mgr-chart-sk">
          <span className="odm-sk" style={{ width: '100%', height: 200 }} />
        </div>
        <div className="odm-card odm-mgr-chart-sk">
          <span className="odm-sk" style={{ width: '100%', height: 200 }} />
        </div>
      </div>
      <div className="odm-card odm-mgr-chart-sk">
        <span className="odm-sk" style={{ width: '100%', height: 160 }} />
      </div>
      <span className="odm-visually-hidden">{t.loading}</span>
    </div>
  )
}
