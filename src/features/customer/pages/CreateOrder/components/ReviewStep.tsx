import type { ReactNode } from 'react'

import type {
  CustomerConsultation,
  PreferredTimeOption,
  ServiceDeliverableOption,
  ServiceOption,
  ServicePricingEstimate,
} from '../../../api/customerApi'
import type { FormErrors, FormState, UpdateField } from '../../../lib/createOrder/types'
import { ConsultationSummaryCard } from './ConsultationSummaryCard'
import { DeliverablesCard } from './DeliverablesCard'
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
  consultation: CustomerConsultation | null
  aiAnalysisRequested: boolean
  pricingEstimate: ServicePricingEstimate | null
  pricingLoading: boolean
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
        />
      </div>
      <aside className="co-stack co-summary">
        <RequestSummaryCard
          form={p.form}
          service={p.service}
          time={p.time}
          deliverable={p.deliverable}
          consultation={p.consultation}
          aiAnalysisRequested={p.aiAnalysisRequested}
        />
        <PricingEstimateCard
          estimate={p.pricingEstimate}
          loading={p.pricingLoading}
          hasService={Boolean(p.service)}
          aiAnalysisRequested={p.aiAnalysisRequested}
        />
        <ConsultationSummaryCard
          form={p.form}
          consultation={p.consultation}
          service={p.service}
          aiAnalysisRequested={p.aiAnalysisRequested}
        />
        {p.footer && <div className="co-summary-cta">{p.footer}</div>}
      </aside>
    </div>
  )
}
