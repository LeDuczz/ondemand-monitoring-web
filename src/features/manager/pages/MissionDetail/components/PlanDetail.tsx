import {
  formatDuration,
  formatNumber,
} from '../../../components/common/missionDetailHelpers'
import type {
  MissionPlanResponse,
  PersistedPostDeviceCheckResponse,
  PreflightCheckItem,
} from '../../../types/missions'
import { MetricTile } from './MetricTile'
import { useI18n } from '../../../../../shared/i18n'
import { planDetailMessages } from './PlanDetail.messages'

function batteryFromPrecheck(
  items?: PreflightCheckItem[] | null,
): number | null {
  const item = items?.find((it) =>
    /battery/i.test(`${it.checkType} ${it.checkName}`),
  )
  const match = item?.message?.match(/(\d+(?:[.,]\d+)?)\s*%/)
  return match ? Number(match[1].replace(',', '.')) : null
}

export function PlanDetail({
  plan,
  postcheck,
  precheckItems,
}: {
  plan: MissionPlanResponse | null
  postcheck?: PersistedPostDeviceCheckResponse | null
  precheckItems?: PreflightCheckItem[] | null
}) {
  const { t } = useI18n(planDetailMessages)

  if (!plan) {
    return <div className="odm-or-empty">{t.noFlightPlanYet}</div>
  }
  const estimatedUsedPercent =
    plan.estimatedBatteryUsedPercent ??
    (plan.estimatedEnergyMah != null && plan.batteryCapacityMah
      ? (plan.estimatedEnergyMah / plan.batteryCapacityMah) * 100
      : null)
  const remainingBattery =
    plan.estimatedRemainingBatteryPercent ??
    postcheck?.landingBatteryPercent ??
    null
  return (
    <div className="odm-or-detail-grid">
      <MetricTile label={t.algorithm} value={plan.planningAlgorithm} />
      <MetricTile
        label={t.distance}
        value={formatNumber(plan.plannedDistanceM, ' m')}
      />
      <MetricTile
        label={t.duration}
        value={formatDuration(plan.plannedDurationSec)}
      />
      <MetricTile
        label={t.energy}
        value={formatNumber(plan.estimatedEnergyMah, ' mAh')}
      />
      <MetricTile
        label={t.batteryBeforeFlight}
        value={formatNumber(
          plan.availableBatteryPercentAtPlanning ??
            batteryFromPrecheck(precheckItems),
          '%',
        )}
      />
      <MetricTile
        label={t.estimatedBatteryUse}
        value={formatNumber(estimatedUsedPercent, '%')}
      />
      <MetricTile
        label={t.batteryRemaining}
        value={formatNumber(remainingBattery, '%')}
      />
      <MetricTile
        label={t.maxAltitude}
        value={formatNumber(plan.maxPlannedAltitudeM, ' m')}
      />
      <MetricTile label={t.waypoint} value={plan.waypoints?.length ?? 0} />
    </div>
  )
}
