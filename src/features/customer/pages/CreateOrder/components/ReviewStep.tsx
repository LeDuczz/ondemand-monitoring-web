import type {
  CustomerConsultation,
  PreferredTimeOption,
  ServiceDeliverableOption,
  ServiceOption,
  ServicePricingEstimate,
} from '../../../api/customerApi'
import type {
  FormErrors,
  FormState,
  UpdateField,
} from '../../../lib/createOrder/types'
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
  deliverablesError?: unknown
  reloadDeliverables: () => void
  consultation: CustomerConsultation | null
  aiAnalysisRequested: boolean
  pricingEstimate: ServicePricingEstimate | null
  pricingLoading: boolean
}

/** Step 4: choose deliverables and review before the confirm dialog. */
export function ReviewStep(p: Props) {
  return (
    <div className="co-grid is-wide">
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
      </div>
      <ConsultationSummaryCard
        form={p.form}
        consultation={p.consultation}
        service={p.service}
      />
    </div>
  )
}
