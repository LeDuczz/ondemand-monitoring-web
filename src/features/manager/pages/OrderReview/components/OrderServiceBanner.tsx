import { type OrderIconName } from '../../../components/common/OrderIcon'
import './OrderServiceBanner.css'
import { clean } from '../orderDeliverableLabels'
import { BannerBackground } from './BannerBackground'
import { ServiceIdentity } from './ServiceIdentity'
import { ServiceDeliverableTags } from './ServiceDeliverableTags'
import { StepIndicator } from './StepIndicator'

export type OrderServiceBannerProps = {
  serviceName: string
  serviceDescription?: string | null
  serviceIcon?: OrderIconName | null
  currentStep: number
  totalSteps: number
  /** Real deliverable / result-format labels of the order. */
  deliverables?: string[] | null
  /** Label for the small "SERVICE" eyebrow, e.g. "DỊCH VỤ". */
  eyebrow: string
  /** Formats the step indicator, e.g. (1, 7) => "Bước 1/7". */
  stepLabel: (current: number, total: number) => string
}

export function OrderServiceBanner({
  serviceName,
  serviceDescription,
  serviceIcon,
  currentStep,
  totalSteps,
  deliverables,
  eyebrow,
  stepLabel,
}: OrderServiceBannerProps) {
  const name = clean(serviceName)
  const labels = deliverables ?? []
  return (
    <section className="odm-osb" aria-label={name ?? eyebrow}>
      <BannerBackground />
      <div className="odm-osb-main">
        {name ? (
          <ServiceIdentity
            name={name}
            description={clean(serviceDescription)}
            icon={serviceIcon ?? 'service'}
            eyebrow={eyebrow}
          />
        ) : null}
        <ServiceDeliverableTags labels={labels} />
      </div>
      <StepIndicator stepText={stepLabel(currentStep, totalSteps)} />
    </section>
  )
}
