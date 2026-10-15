import type { FlightAreaAssessment } from '../../../../customer/api/customerApi'
import { useI18n } from '../../../../../shared/i18n'
import { areaCheckHeadMessages } from './AreaCheckHead.messages'
import { StatusBadge, type UiTone } from '../../../../../shared/components/ui'
import { getLanguage } from '../../../../../shared/i18n'

function riskTone(level: string): UiTone {
  if (level === 'HIGH_RISK') return 'danger'
  if (level === 'NEEDS_REVIEW') return 'warning'
  return 'success'
}

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
      <h2>{t.monitoringAreaCheck}</h2>
      {data ? (
        <StatusBadge tone={riskTone(data.assessment.level)}>
          {riskLabel(data.assessment.level)}
        </StatusBadge>
      ) : null}
    </div>
  )
}
