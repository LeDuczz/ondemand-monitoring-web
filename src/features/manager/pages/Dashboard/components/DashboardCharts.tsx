import { Card } from '../../../../../shared/components/ui'
import type { ManagerDashboardResponse } from '../../../types/dashboard'
import { MissionStatusChart } from './MissionStatusChart'
import { DroneStatusDonut } from './DroneStatusDonut'
import { useI18n } from '../../../../../shared/i18n'
import { dashboardChartsMessages } from './DashboardCharts.messages'

export function DashboardCharts({ data }: { data: ManagerDashboardResponse }) {
  const { t } = useI18n(dashboardChartsMessages)
  return (
    <div className="mng-dash-grid">
      <Card title={t.missionsByStatus}>
        <MissionStatusChart days={data.missionStatusByDay} />
      </Card>
      <Card title={t.droneFleetStatus}>
        <DroneStatusDonut data={data.droneStatusBreakdown} />
      </Card>
    </div>
  )
}
