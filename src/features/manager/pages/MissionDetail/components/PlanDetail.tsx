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
  const { t, lang } = useI18n(planDetailMessages)

  if (!plan) {
    return <p className="odm-or-empty">{t.noFlightPlanYet}</p>
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
    <div className="odm-md-metrics">
      <MetricTile label={t.algorithm} value={plan.planningAlgorithm} />
      <MetricTile
        label={t.distance}
        value={formatNumber(plan.plannedDistanceM, ' m', lang)}
      />
      <MetricTile
        label={t.duration}
        value={formatDuration(plan.plannedDurationSec, lang)}
      />
      <MetricTile
        label={t.energy}
        value={formatNumber(plan.estimatedEnergyMah, ' mAh', lang)}
      />
      <MetricTile
        label={t.batteryBeforeFlight}
        value={formatNumber(
          plan.availableBatteryPercentAtPlanning ??
            batteryFromPrecheck(precheckItems),
          '%',
          lang,
        )}
      />
      <MetricTile
        label={t.estimatedBatteryUse}
        value={formatNumber(estimatedUsedPercent, '%', lang)}
      />
      <MetricTile
        label={t.batteryRemaining}
        value={formatNumber(remainingBattery, '%', lang)}
      />
      <MetricTile
        label={t.maxAltitude}
        value={formatNumber(plan.maxPlannedAltitudeM, ' m', lang)}
      />
      <MetricTile label={t.waypoint} value={plan.waypoints?.length ?? 0} />
    </div>
  )
}
