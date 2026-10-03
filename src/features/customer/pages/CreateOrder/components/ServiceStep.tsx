import type { CustomerConsultation, ServiceOption, ServicePricingEstimate } from '../../../api/customerApi'
import { findRecommendedService } from '../../../lib/createOrder/consultation'
import type { FormErrors, FormState, UpdateField } from '../../../lib/createOrder/types'
import type { useConsultation } from '../hooks/useConsultation'
import { AiAnalysisOption } from './AiAnalysisOption'
import { ConsultationChat } from './ConsultationChat'
import { PricingEstimateCard } from './PricingEstimateCard'
import { RequestInfoPanel } from './RequestInfoPanel'
import { ServicePicker } from './ServicePicker'

type Props = {
  form: FormState
  errors: FormErrors
  update: UpdateField
  services: ServiceOption[]
  servicesLoading: boolean
  chat: ReturnType<typeof useConsultation>
  consultation: CustomerConsultation | null
  aiAnalysisRequested: boolean
  setAiAnalysisRequested: (value: boolean) => void
  pricingEstimate: ServicePricingEstimate | null
  pricingLoading: boolean
}

/** Step 1: choose the core service first; AI consultation is optional support. */
export function ServiceStep(p: Props) {
  const recommended = findRecommendedService(p.consultation, p.services)
  const selected = p.services.find((s) => s.id === p.form.serviceId)

  return (
    <div className="co-grid">
      <div className="co-stack">
        <ServicePicker
          services={p.services}
          loading={p.servicesLoading}
          selectedId={p.form.serviceId}
          suggested={recommended}
          error={p.errors.serviceId}
          onSelect={(id) => p.update('serviceId', id)}
        />
        <ConsultationChat chat={p.chat} />
      </div>
      <div className="co-stack">
        <RequestInfoPanel
          form={p.form}
          errors={p.errors}
          update={p.update}
          consultation={p.consultation}
          recommended={recommended}
          selected={selected}
        />
        {selected && (
          <AiAnalysisOption checked={p.aiAnalysisRequested} onChange={p.setAiAnalysisRequested} />
        )}
        <PricingEstimateCard
          estimate={p.pricingEstimate}
          loading={p.pricingLoading}
          hasService={Boolean(selected)}
          aiAnalysisRequested={p.aiAnalysisRequested}
        />
      </div>
    </div>
  )
}
