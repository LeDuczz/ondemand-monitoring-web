import type { ExecutionPlan } from '../../../types/planning'
import type { OrderChecklistSnapshot } from '../../../types/orders'
import { planningBlocker } from '../../../lib/planningErrors'
import { useI18n } from '../../../../../shared/i18n'
import { executionPlanSummaryMessages } from './ExecutionPlanSummary.messages'

export function ExecutionPlanSummary({
  plan,
  items,
}: {
  plan: ExecutionPlan
  items: OrderChecklistSnapshot[]
}) {
  const { t } = useI18n(executionPlanSummaryMessages)

  const coverage = plan.coverage
  return (
    <section aria-label={t.executionPlanSummary}>
      <dl className="odm-planning-metrics">
        <div>
          <dt>{t.requirement}</dt>
          <dd>{coverage.total}</dd>
        </div>
        <div>
          <dt>{t.assigned}</dt>
          <dd>{coverage.covered}</dd>
        </div>
        <div>
          <dt>{t.remaining}</dt>
          <dd>{coverage.uncovered}</dd>
        </div>
        <div>
          <dt>{t.repeatedAssignment}</dt>
          <dd>{coverage.repeated}</dd>
        </div>
      </dl>
      {coverage.uncoveredItemIds.length > 0 && (
        <ul aria-label={t.checklistNotCovered}>
          {coverage.uncoveredItemIds.map((id) => (
            <li key={id}>
              {items.find((item) => item.id === id)?.content ?? id}
            </li>
          ))}
        </ul>
      )}
      {plan.planStatus === 'DRAFT' && plan.blockers.length > 0 && (
        <ul aria-label={t.finalizeBlockers}>
          {plan.blockers.map((blocker) => (
            <li key={blocker}>{planningBlocker(blocker)}</li>
          ))}
        </ul>
      )}
    </section>
  )
}
