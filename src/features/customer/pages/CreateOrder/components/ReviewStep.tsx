import type {
  CustomerConsultation,
  PreferredTimeOption,
  ServiceDeliverableOption,
  ServiceOption,
  ServicePricingEstimate,
} from '../../../api/customerApi'
import type { FormState } from '../../../lib/createOrder/types'
import { ConsultationSummaryCard } from './ConsultationSummaryCard'
import { PricingEstimateCard } from './PricingEstimateCard'
import { RequestSummaryCard } from './RequestSummaryCard'

type Props = {
  form: FormState
  service?: ServiceOption
  time?: PreferredTimeOption
  deliverable?: ServiceDeliverableOption
  consultation: CustomerConsultation | null
  aiAnalysisRequested: boolean
  pricingEstimate: ServicePricingEstimate | null
  pricingLoading: boolean
}

/** Step 4: read-only review before the confirm dialog. */
export function ReviewStep(p: Props) {
  return (
    <div className="co-grid is-wide">
      <div className="co-stack">
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
      <ConsultationSummaryCard form={p.form} consultation={p.consultation} service={p.service} />
    </div>
  )
}
