import type { ReactNode } from 'react'

import { AreaDecisionSummary } from './AreaDecisionSummary'
import { AreaFacts } from './AreaFacts'
import { AreaMinistryViolations } from './AreaMinistryViolations'
import { AreaFindings } from './AreaFindings'
import type { FlightAreaAssessment } from '../../../../customer/api/customerApi'
import type { ResolvedOrderGps } from '../../../components/common/orderGps'
import type { FlightAreaFindingSeverity } from '../../../../customer/api/customerApi'
import { useI18n } from '../../../../../shared/i18n'
import { areaResultsCardMessages } from './AreaResultsCard.messages'

export function AreaResultsCard({
  assessment,
  canRecheck,
  resolved,
  radiusM,
  data,
  hasMinistryViolations,
  ministryViolatedZones,
  findings,
  managerReview,
}: {
  assessment: {
    data: FlightAreaAssessment | null | undefined
    error: unknown
    loading: boolean
    reload: () => void
  }
  /** Only a PENDING order can still be re-checked. */
  canRecheck: boolean
  resolved: ResolvedOrderGps | null
  radiusM: number
  data: FlightAreaAssessment | null | undefined
  hasMinistryViolations: boolean
  ministryViolatedZones: string[]
  findings:
    | { code: string; severity: FlightAreaFindingSeverity; message: string }[]
    | undefined
  /** Manager's own judgement of the area, rendered under the map result. */
  managerReview?: ReactNode
}) {
  const { t } = useI18n(areaResultsCardMessages)

  return (
    <section className="odm-or-card">
      <header className="odm-or-card-head">
        <span className="odm-or-card-title">
          {t.conclusionAboutTheFlightArea}
        </span>
        {canRecheck ? (
          <button
            type="button"
            className="odm-or-btn-outline"
            onClick={assessment.reload}
            disabled={assessment.loading}
          >
            {assessment.loading ? t.checking : t.checkAgain}
          </button>
        ) : null}
      </header>
      <div className="odm-or-card-body odm-or-area-results">
        {!resolved || radiusM <= 0 ? (
          <p className="odm-or-empty">{t.donChuaCoDuToa}</p>
        ) : assessment.error ? (
          <p className="odm-or-area-error" role="alert">
            {t.khongTaiDuocKetQua}
          </p>
        ) : assessment.loading && !data ? (
          <p className="odm-or-empty">{t.analyzingTheMonitoringArea}</p>
        ) : data ? (
          <>
            <AreaDecisionSummary data={data} />
            <AreaFacts data={data} />
            <AreaMinistryViolations
              hasMinistryViolations={hasMinistryViolations}
              ministryViolatedZones={ministryViolatedZones}
            />
            <AreaFindings
              findings={findings}
              hasMinistryViolations={hasMinistryViolations}
              favorable={data.assessment.level === 'FAVORABLE'}
            />
            {(findings && findings.length > 0) || hasMinistryViolations ? (
              <p className="odm-or-area-disclaimer">
                {data.assessment.disclaimer}
              </p>
            ) : null}
            <a
              className="odm-or-area-source"
              href={
                data.ministryFlightBan?.sourceUrl ??
                'https://cambay.mod.gov.vn/'
              }
              target="_blank"
              rel="noreferrer"
            >
              {t.openTheMinistryOfNational}
            </a>
            {managerReview}
          </>
        ) : null}
      </div>
    </section>
  )
}
