import { Card } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import type { ServicePricingEstimate } from '../../../api/customerApi'
import { formatMoney } from '../../../lib/createOrder/format'
import { aiAddonPrice } from '../../../lib/createOrder/payload'
import { pricingEstimateMessages } from './PricingEstimateCard.messages'

type Props = {
  estimate: ServicePricingEstimate | null
  loading: boolean
  hasService: boolean
  aiAnalysisRequested: boolean
}

/** Pricing estimate from `GET /api/services/pricing-estimate`. */
export function PricingEstimateCard({ estimate, loading, hasService, aiAnalysisRequested }: Props) {
  const { t } = useI18n(pricingEstimateMessages)

  let body
  if (!hasService) body = <p className="co-hint">{t.pickService}</p>
  else if (loading && !estimate) body = <p className="co-hint">{t.loading}</p>
  else if (!estimate) body = <p className="co-hint">{t.unavailable}</p>
  else {
    body = (
      <div className="co-money">
        <div className="co-money-row">
          <span>{t.servicePrice}</span>
          <strong>{formatMoney(estimate.servicePrice)}</strong>
        </div>
        <div className="co-money-row">
          <span>{t.aiAnalysis}</span>
          <strong>
            {aiAnalysisRequested ? `+${formatMoney(aiAddonPrice(estimate))}` : formatMoney(0)}
          </strong>
        </div>
        <div className="co-money-row co-money-total">
          <span>{t.total}</span>
          <span>{formatMoney(estimate.totalPrice)}</span>
        </div>
      </div>
    )
  }
  return <Card title={t.title}>{body}</Card>
}
