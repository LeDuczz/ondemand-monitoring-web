import type { ExecutionPlan } from '../../types/planning'
import type { OrderChecklistSnapshot } from '../../types/orders'
import { planningBlocker } from '../../lib/planningErrors'

export function ExecutionPlanSummary({
  plan,
  items,
}: {
  plan: ExecutionPlan
  items: OrderChecklistSnapshot[]
}) {
  const coverage = plan.coverage
  return (
    <section aria-label="Execution plan summary">
      <dl className="odm-planning-metrics">
        <div>
          <dt>Yêu cầu</dt>
          <dd>{coverage.total}</dd>
        </div>
        <div>
          <dt>Đã phân công</dt>
          <dd>{coverage.covered}</dd>
        </div>
        <div>
          <dt>Còn lại</dt>
          <dd>{coverage.uncovered}</dd>
        </div>
        <div>
          <dt>Phân công lặp</dt>
          <dd>{coverage.repeated}</dd>
        </div>
      </dl>
      {coverage.uncoveredItemIds.length > 0 && (
        <ul aria-label="Checklist chưa phủ">
          {coverage.uncoveredItemIds.map((id) => (
            <li key={id}>
              {items.find((item) => item.id === id)?.content ?? id}
            </li>
          ))}
        </ul>
      )}
      {plan.planStatus === 'DRAFT' && plan.blockers.length > 0 && (
        <ul aria-label="Finalize blockers">
          {plan.blockers.map((blocker) => (
            <li key={blocker}>{planningBlocker(blocker)}</li>
          ))}
        </ul>
      )}
    </section>
  )
}
