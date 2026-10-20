import type { FlightAreaFindingSeverity } from '../../../../customer/api/customerApi'
import { useI18n } from '../../../../../shared/i18n'
import { areaFindingsMessages } from './AreaFindings.messages'

export function AreaFindings({
  findings,
  hasMinistryViolations,
  favorable,
}: {
  findings:
    | { code: string; severity: FlightAreaFindingSeverity; message: string }[]
    | undefined
  hasMinistryViolations: boolean
  /** The assessment level is FAVORABLE; otherwise "no warning" would be misleading. */
  favorable: boolean
}) {
  const { t } = useI18n(areaFindingsMessages)

  return findings && findings.length > 0 ? (
    <div className="odm-or-area-findings">
      <strong>{t.warningsToReview}</strong>
      <ul>
        {findings.map((finding) => (
          <li
            key={finding.code}
            className={`is-${finding.severity.toLowerCase()}`}
          >
            {finding.message}
          </li>
        ))}
      </ul>
    </div>
  ) : !hasMinistryViolations && favorable ? (
    <div className="odm-or-area-clear">
      <strong>{t.noAreaWarningsNoted}</strong>
      <small>{t.stillConfirmOnSite}</small>
    </div>
  ) : null
}
