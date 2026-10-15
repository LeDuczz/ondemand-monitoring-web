import type { ResourceSuggestions } from '../../../types/missions'
import { useI18n } from '../../../../../shared/i18n'
import { infeasibleCardMessages } from './InfeasibleCard.messages'

export function InfeasibleCard({
  suggestions,
}: {
  suggestions: ResourceSuggestions
}) {
  const { t } = useI18n(infeasibleCardMessages)
  return !suggestions.feasible ? (
    <div className="odm-card" style={{ marginBottom: 14 }}>
      <div className="odm-card-body">
        <div style={{ fontWeight: 700, marginBottom: 4 }}>
          {t.noEligibleDrones}
        </div>
        <div style={{ color: 'var(--tx3)', marginBottom: 10 }}>
          {suggestions.explanation}
        </div>
        {suggestions.alternatives.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div className="odm-mgr-review-hint" style={{ fontWeight: 700 }}>
              {t.alternativeDays}
            </div>
            {suggestions.alternatives.map((alt) => (
              <div key={alt.priority} className="odm-mgr-rejected-row">
                <span style={{ fontWeight: 700 }}>{alt.label}</span>
                <span>
                  {alt.dateLabel} · {alt.windowLabel}
                </span>
                <span className="odm-tn">
                  {t.dronesFree(alt.eligibleDroneCount)}
                </span>
                <span className="odm-tn">
                  {t.operatorsFree(alt.eligibleOperatorCount)}
                </span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  ) : null
}
