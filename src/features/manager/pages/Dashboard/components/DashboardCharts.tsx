import { MissionStatusChart } from './MissionStatusChart'
import { DroneStatusDonut } from './DroneStatusDonut'
import { dashboardPageMessages } from '../DashboardPage.messages'
import { useI18n } from '../../../../../shared/i18n'
import type { ManagerDashboardResponse } from '../../../types/dashboard'

export function DashboardCharts({ data }: { data: ManagerDashboardResponse }) {
  const { t } = useI18n(dashboardPageMessages)
  return (
    <div className="odm-mgr-charts-row">
      <div className="odm-card">
        <div className="odm-card-header">{t.missionsByStatus}</div>
        <div className="odm-card-body">
          <MissionStatusChart days={data.missionStatusByDay} />
        </div>
      </div>
      <div className="odm-card">
        <div className="odm-card-header">{t.droneFleetStatus}</div>
        <div className="odm-card-body">
          <DroneStatusDonut data={data.droneStatusBreakdown} />
        </div>
      </div>
    </div>
  )
}
