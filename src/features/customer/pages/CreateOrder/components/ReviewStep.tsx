import type { ReactNode } from 'react'

import type {
  CustomerConsultation,
  PreferredTimeOption,
  ServiceDeliverableOption,
  ServiceOption,
  ServicePricingEstimate,
} from '../../../api/customerApi'
import type { FormErrors, FormState, Step, UpdateField } from '../../../lib/createOrder/types'
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
  consultation: CustomerConsultation | null
  aiAnalysisRequested: boolean
  pricingEstimate: ServicePricingEstimate | null
  pricingLoading: boolean
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
          form={p.form}
          errors={p.errors}
          update={p.update}
          deliverables={p.deliverables}
          loading={p.deliverablesLoading}
          error={p.deliverablesError}
          onRetry={p.reloadDeliverables}
        />
        <DeliveryOptionsCard form={p.form} errors={p.errors} update={p.update} />
      </div>
      <aside className="co-stack co-summary is-tall">
        <RequestSummaryCard
          form={p.form}
          service={p.service}
          time={p.time}
          deliverable={p.deliverable}
          consultation={p.consultation}
          aiAnalysisRequested={p.aiAnalysisRequested}
          onEdit={p.onEdit}
        />
        <PricingEstimateCard
          estimate={p.pricingEstimate}
          loading={p.pricingLoading}
          hasService={Boolean(p.service)}
          aiAnalysisRequested={p.aiAnalysisRequested}
        />
        {p.footer && <div className="co-summary-cta">{p.footer}</div>}
      </aside>
    </div>
  )
}
