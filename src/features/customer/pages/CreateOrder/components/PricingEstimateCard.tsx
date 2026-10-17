import { Card } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import type { ServicePricingEstimate } from '../../../api/customerApi'
import { formatMoney } from '../../../lib/createOrder/format'
import { aiAddonPrice } from '../../../lib/createOrder/payload'
import { usesMedia, type ChecklistRow } from '../../../lib/checklist/types'
import { pricingEstimateMessages } from './PricingEstimateCard.messages'

type Props = {
  estimate: ServicePricingEstimate | null
  loading: boolean
  hasService: boolean
  aiAnalysisRequested: boolean
  additionalChecklists?: ChecklistRow[]
}

function requestedMedia(row: ChecklistRow) {
  if (usesMedia(row))
    return { images: row.requestedImageCount, videos: row.requestedVideoCount }
  return row.requiredEvidenceType === 'VIDEO'
    ? { images: 0, videos: row.minimumEvidenceCount }
    : { images: row.minimumEvidenceCount, videos: 0 }
}

/** Pricing estimate from `GET /api/services/pricing-estimate`. */
export function PricingEstimateCard({
  estimate,
  loading,
  hasService,
  aiAnalysisRequested,
  additionalChecklists = [],
}: Props) {
  const { t, locale } = useI18n(pricingEstimateMessages)

  let body
  if (!hasService) body = <p className="co-hint">{t.pickService}</p>
  else if (loading && !estimate) body = <p className="co-hint">{t.loading}</p>
  else if (!estimate) body = <p className="co-hint">{t.unavailable}</p>
  else {
    const hasAdditionalServices = additionalChecklists.length > 0 || Boolean(estimate.quotePending)
    body = (
      <div className="co-money">
        <div className="co-money-row">
          <span>{t.servicePrice}</span>
          <strong>{formatMoney(estimate.servicePrice, locale)}</strong>
        </div>
        <div className="co-money-row">
          <span>{t.aiAnalysis}</span>
          <strong>
            {aiAnalysisRequested
              ? `+${formatMoney(aiAddonPrice(estimate), locale)}`
              : formatMoney(0, locale)}
          </strong>
        </div>
        {additionalChecklists.length > 0 && (
          <div className="co-money-row co-money-pending">
            <span>{t.additionalServiceRow}</span>
            <strong>{t.additionalPending(additionalChecklists.length)}</strong>
          </div>
        )}
        <div className="co-money-row co-money-total">
          <span>{t.total}</span>
          <span>{formatMoney(estimate.totalPrice, locale)}</span>
        </div>
        <p className="co-estimate-notice">{t.estimateNotice}</p>
        {additionalChecklists.length > 0 && (
          <section className="co-additional-services" aria-labelledby="additional-services-title">
            <h3 id="additional-services-title">{t.additionalServices}</h3>
            <ul>
              {additionalChecklists.map((item) => {
                const media = requestedMedia(item)
                return (
                  <li key={item.key}>
                    <strong>{item.content}</strong>
                    <span>{t.mediaCounts(media.images, media.videos)}</span>
                    <span className="co-additional-status">{t.awaitingManagerQuote}</span>
                  </li>
                )
              })}
            </ul>
          </section>
        )}
        {hasAdditionalServices && (
          <p className="co-notice" role="status">
            {t.quotePending}
          </p>
        )}
      </div>
    )
  }
  return <Card title={t.title}>{body}</Card>
}
