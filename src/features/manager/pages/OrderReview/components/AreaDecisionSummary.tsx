import type { FlightAreaAssessment } from '../../../../customer/api/customerApi'
import { useI18n } from '../../../../../shared/i18n'
import { areaDecisionSummaryMessages } from './AreaDecisionSummary.messages'

export function AreaDecisionSummary({ data }: { data: FlightAreaAssessment }) {
  const { t } = useI18n(areaDecisionSummaryMessages)

  const level = data.assessment.level
  const hasMinistryConflict =
    Boolean(data.ministryFlightBan?.violatedZones.length) ||
    (data.ministryFlightBan?.violatedAreaSquareMeters ?? 0) > 0
  const title =
    level === 'HIGH_RISK'
      ? t.thisAreaShouldNotBe
      : level === 'NEEDS_REVIEW'
        ? t.needsFurtherChecksBeforeApproval
        : t.noSignificantObstaclesFound
  const guidance = hasMinistryConflict
    ? t.banDoCuaBoQuoc
    : level === 'HIGH_RISK' || level === 'NEEDS_REVIEW'
      ? t.hayXemCacCanhBao
      : t.banCoTheTiepTuc

  return (
    <div className={`odm-or-area-decision is-${level.toLowerCase()}`}>
      <strong>{title}</strong>
      <p>{guidance}</p>
    </div>
  )
}
