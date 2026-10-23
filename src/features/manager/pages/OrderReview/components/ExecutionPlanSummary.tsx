import type { ExecutionPlan } from '../../../types/planning'
import type { OrderChecklistSnapshot } from '../../../types/orders'
import { useI18n } from '../../../../../shared/i18n'
import { executionPlanSummaryMessages } from './ExecutionPlanSummary.messages'

export function ExecutionPlanSummary({
  plan,
}: {
  plan: ExecutionPlan
  items: OrderChecklistSnapshot[]
}) {
  const { t } = useI18n(executionPlanSummaryMessages)
  const coverage = plan.coverage
  return (
    <section aria-label="Execution plan summary">
      <dl className="odm-planning-metrics">
        <div>
          <dt>{t.required}</dt>
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
          <dt>{t.repeated}</dt>
          <dd>{coverage.repeated}</dd>
        </div>
      </dl>
    </section>
  )
}
