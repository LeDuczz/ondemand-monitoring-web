import type { FlightAreaAssessment } from '../../../../customer/api/customerApi'
import { useI18n } from '../../../../../shared/i18n'
import { areaCheckHeadMessages } from './AreaCheckHead.messages'
import { getLanguage } from '../../../../../shared/i18n'

function riskLabel(level: string) {
  if (level === 'HIGH_RISK')
    return areaCheckHeadMessages[getLanguage()].highRisk
  if (level === 'NEEDS_REVIEW')
    return areaCheckHeadMessages[getLanguage()].needsReview
  return areaCheckHeadMessages[getLanguage()].favorable
}

export function AreaCheckHead({
  data,
}: {
  data: FlightAreaAssessment | null | undefined
}) {
  const { t } = useI18n(areaCheckHeadMessages)

  return (
    <div className="odm-or-area-check-head">
      <div>
        <h2>{t.monitoringAreaCheck}</h2>
        <p>{t.giupXacDinhKhuVuc}</p>
      </div>
      {data ? (
        <span
          className={`odm-or-area-risk is-${data.assessment.level.toLowerCase()}`}
        >
          {riskLabel(data.assessment.level)}
        </span>
      ) : null}
    </div>
  )
}
