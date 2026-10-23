import type { ExecutionPlan } from '../../../types/planning'
import type { OrderChecklistSnapshot } from '../../../types/orders'
import { Card } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import { executionPlanSummaryMessages } from './ExecutionPlanSummary.messages'

/** Coverage progress of the execution plan: a bar plus the four counters. */
export function ExecutionPlanSummary({
  plan,
}: {
  plan: ExecutionPlan
  items: OrderChecklistSnapshot[]
}) {
  const { t } = useI18n(executionPlanSummaryMessages)
  const coverage = plan.coverage
  return (
    <Card title={t.coverageTitle}>
      <section aria-label="Execution plan summary" className="mgr-plan-coverage">
        <progress
          className="mgr-plan-progress"
          max={Math.max(coverage.total, 1)}
          value={Math.min(coverage.covered, Math.max(coverage.total, 1))}
          aria-label={t.coverageTitle}
        />
        <dl className="odm-planning-metrics mgr-plan-metrics">
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
    </Card>
  )
}
