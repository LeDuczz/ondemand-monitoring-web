import type { ReactNode } from 'react'

import type {
  CustomerConsultation,
  PreferredTimeOption,
  ServiceDeliverableOption,
  ServiceOption,
  ServicePricingEstimate,
} from '../../../api/customerApi'
import type { FormErrors, FormState, Step, UpdateField } from '../../../lib/createOrder/types'
import type { ChecklistRow } from '../../../lib/checklist/types'
import { DeliverablesCard } from './DeliverablesCard'
import { DeliveryOptionsCard } from './DeliveryOptionsCard'
import { PricingEstimateCard } from './PricingEstimateCard'
import { RequestSummaryCard } from './RequestSummaryCard'

type Props = {
  form: FormState
  errors: FormErrors
  update: UpdateField
  service?: ServiceOption
  time?: PreferredTimeOption
  deliverable?: ServiceDeliverableOption
  deliverables: ServiceDeliverableOption[]
  deliverablesLoading: boolean
  deliverablesError?: unknown
  reloadDeliverables: () => void
  mediaTotals: { images: number; videos: number }
  consultation: CustomerConsultation | null
  aiAnalysisRequested: boolean
  pricingEstimate: ServicePricingEstimate | null
  pricingLoading: boolean
  additionalChecklists: ChecklistRow[]
  packageSelectedCount: number
  packageCount: number
  /** Jump back to an earlier step from the summary. */
  onEdit: (step: Step) => void
  /** Wizard actions, rendered at the bottom of the sticky summary panel. */
  footer?: ReactNode
}

/** Step 5: choose deliverables on the left, review + submit on the right. */
export function ReviewStep(p: Props) {
  return (
    <div className="co-grid is-review">
      <div className="co-stack">
        <DeliverablesCard
          deliverables={p.deliverables}
          loading={p.deliverablesLoading}
          error={p.deliverablesError}
          onRetry={p.reloadDeliverables}
          mediaTotals={p.mediaTotals}
        />
        <DeliveryOptionsCard
          form={p.form}
          errors={p.errors}
          update={p.update}
          mediaTotals={p.mediaTotals}
        />
      </div>
      <aside className="co-stack co-summary is-tall">
        <RequestSummaryCard
          mediaTotals={p.mediaTotals}
          form={p.form}
          service={p.service}
          time={p.time}
          deliverable={p.deliverable}
          consultation={p.consultation}
          aiAnalysisRequested={p.aiAnalysisRequested}
          checklistCounts={{
            total: p.packageSelectedCount + p.additionalChecklists.length,
            packageSelected: p.packageSelectedCount,
            packageTotal: p.packageCount,
            additional: p.additionalChecklists.length,
          }}
          onEdit={p.onEdit}
        />
        <PricingEstimateCard
          estimate={p.pricingEstimate}
          loading={p.pricingLoading}
          hasService={Boolean(p.service)}
          aiAnalysisRequested={p.aiAnalysisRequested}
          additionalChecklists={p.additionalChecklists}
        />
        {p.footer && <div className="co-summary-cta">{p.footer}</div>}
      </aside>
    </div>
  )
}
