import type { ExecutionPlan } from '../../types/planning'
import type { OrderChecklistSnapshot } from '../../types/orders'

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
      <h3>
        Kế hoạch thực hiện{' '}
        <span className="odm-or-pill">
          {plan.planStatus} · revision {plan.revision}
        </span>
      </h3>
      <div className="odm-planning-metrics">
        <span>
          Tổng checklist <strong>{coverage.total}</strong>
        </span>
        <span>
          Đã phủ <strong>{coverage.covered}</strong>
        </span>
        <span>
          Chưa phủ <strong>{coverage.uncovered}</strong>
        </span>
        <span>
          Phân công lặp <strong>{coverage.repeated}</strong>
        </span>
      </div>
      <p>
        {coverage.coverageReady
          ? 'Coverage sẵn sàng.'
          : 'Coverage chưa sẵn sàng — còn yêu cầu chưa phân công.'}{' '}
        Phân công lặp là hợp lệ.
      </p>
      {coverage.uncoveredItemIds.length > 0 && (
        <ul aria-label="Checklist chưa phủ">
          {coverage.uncoveredItemIds.map((id) => (
            <li key={id}>
              {items.find((item) => item.id === id)?.content ?? id}
            </li>
          ))}
        </ul>
      )}
      {plan.blockers.length > 0 && (
        <ul aria-label="Finalize blockers">
          {plan.blockers.map((blocker) => (
            <li key={blocker}>{blocker}</li>
          ))}
        </ul>
      )}
    </section>
  )
}
